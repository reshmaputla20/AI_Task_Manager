from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from ..database import get_db
from ..agent.graph import create_agent_graph
from ..agent.tools import set_db_session
from ..utils.api_key_manager import get_api_key_manager
from langchain_core.messages import HumanMessage

import json

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    
    await websocket.accept()

    db_gen = None
    db = None
    try:
        db_gen = get_db()
        db = next(db_gen)
    except Exception as dep_exc:
        print("WebSocket db dependency error:", repr(dep_exc), flush=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
        try:
            if db_gen:
                db_gen.close()
        except Exception:
            pass
        return


    try:
     
        set_db_session(db)

        agent = create_agent_graph()
    except Exception as init_exc:
        # Log initialization error and close websocket
        print("WebSocket init error:", repr(init_exc), flush=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
        try:
            if db_gen:
                db_gen.close()
        except Exception:
            pass
        return

    try:
        while True:
            try:
                data = await websocket.receive_text()
                print("WebSocket received raw:", data, flush=True)
            except WebSocketDisconnect:
                print("Client disconnected")
                break

            try:
                message_data = json.loads(data)
                user_message = message_data.get("message", "")
            except Exception as parse_exc:
                print("WS message parse error:", repr(parse_exc), flush=True)
                await websocket.send_json({"error": "invalid message"})
                continue

            # Run agent
            try:
                state = {"messages": [HumanMessage(content=user_message)]}
                result = agent.invoke(state)
                print(f"Agent result messages count: {len(result['messages'])}", flush=True)
                
                # Find the last AIMessage (agent response) not ToolMessage
                response_text = ""
                for msg in reversed(result["messages"]):
                    print(f"  - Message type: {type(msg).__name__}, content length: {len(msg.content) if hasattr(msg, 'content') and msg.content else 0}", flush=True)
                    if hasattr(msg, 'content') and msg.content and type(msg).__name__ == 'AIMessage':
                        response_text = msg.content
                        break
                
                # If no text response, check if tools were executed and generate a success message
                if not response_text:
                    # Check if the last message is a ToolMessage with a successful tool result
                    for msg in reversed(result["messages"]):
                        if type(msg).__name__ == 'ToolMessage' and hasattr(msg, 'content'):
                            content = msg.content
                            # If tool executed successfully, respond positively
                            if 'successfully' in content.lower() or 'created' in content.lower():
                                response_text = f"Great! {content}"
                                break
                            elif 'error' not in content.lower() and 'not found' not in content.lower():
                                response_text = content
                                break
                
                if not response_text:
                    response_text = "I've processed your request. How else can I help?"
                
                print(f"Final agent response: {response_text[:100]}", flush=True)
                await websocket.send_json({"message": response_text, "type": "agent", "done": True})
            except Exception as run_exc:
                print("Agent run error:", repr(run_exc), flush=True)
                print("Agent run error full:", str(run_exc), flush=True)
                
                # Get API key manager to check for quota errors
                api_key_manager = get_api_key_manager()
                error_str = str(run_exc)
                
                # Check if this is an API key quota/permission error
                if api_key_manager.is_quota_error(error_str):
                    # Mark current key as exhausted and try next one
                    current_key = api_key_manager.get_active_key()
                    if current_key:
                        api_key_manager.mark_key_exhausted(current_key, error_str)
                    
                    # Get user-friendly error message
                    user_message = api_key_manager.get_user_friendly_error(error_str)
                    print(f"API quota/auth error detected. Sending friendly message: {user_message}", flush=True)
                    
                    try:
                        await websocket.send_json({
                            "message": user_message,
                            "type": "error",
                            "done": True,
                            "error_type": "api_quota"
                        })
                    except Exception as send_exc:
                        print(f"Failed to send error response: {send_exc}", flush=True)
                else:
                    # Generic error handling for other exceptions
                    user_message = "An error occurred while processing your request. Please try again."
                    try:
                        await websocket.send_json({
                            "message": user_message,
                            "type": "error",
                            "done": True,
                            "error_type": "agent_error"
                        })
                    except Exception as send_exc:
                        print(f"Failed to send error response: {send_exc}", flush=True)
                
                # Continue loop to allow further requests
                continue

    except Exception as exc:
        # Catch-all for unexpected errors; log and close
        print("Unexpected websocket error:", repr(exc), flush=True)
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
    finally:
        # Ensure dependency generator is closed if present
        try:
            if db_gen:
                db_gen.close()
        except Exception:
            pass
