# ...existing code...
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import Tool
import traceback
import operator
from .tools import get_all_tools
import os
import json
from app.agent.prompt import get_system_prompt
from app.utils.api_key_manager import get_api_key_manager



try:
    from langgraph.prebuilt import ToolExecutor as _ExecutorClass
    _EXEC_KIND = "ToolExecutor"
except Exception:
    _ExecutorClass = None
    try:
        from langgraph.prebuilt import chat_agent_executor as _executor_factory
        _EXEC_KIND = "chat_agent_executor"
    except Exception:
        try:
            from langgraph.prebuilt import create_react_agent as _executor_factory
            _EXEC_KIND = "create_react_agent"
        except Exception:
            _executor_factory = None
            _EXEC_KIND = None

class AgentState(TypedDict):
    messages: Annotated[Sequence[HumanMessage | AIMessage | SystemMessage], operator.add]
    
def _manual_invoke_tool(tools, tool_call):
    """
    Best-effort fallback that tries to run a tool call against the `tools`
    returned by get_all_tools(). This supports tools as dict or list and
    parses JSON arguments when provided as a string.
    """
    # Debug: print what we received
    print(f"_manual_invoke_tool called with tool_call type: {type(tool_call)}, content: {tool_call}", flush=True)
    
    # Handle different tool_call formats
    # In newer versions, tool_call might be a dict with 'name' and 'args' keys
    if isinstance(tool_call, dict):
        name = tool_call.get("name")
        raw_args = tool_call.get("args") or tool_call.get("input") or tool_call.get("kwargs")
    else:
        # try to get name/arguments from the tool_call object
        name = getattr(tool_call, "name", None) or getattr(tool_call, "tool_name", None) \
               or getattr(tool_call, "tool", None)
        raw_args = getattr(tool_call, "arguments", None) or getattr(tool_call, "input", None) \
                   or getattr(tool_call, "kwargs", None)
    
    print(f"  - Extracted name: {name}, raw_args: {raw_args}", flush=True)

    # resolve tool from tools (supports dict or iterable)
    tool_obj = None
    if isinstance(tools, dict):
        tool_obj = tools.get(name)
    else:
        for t in tools:
            tname = getattr(t, "name", None) or getattr(t, "__name__", None) or (getattr(t, "tool", None) and getattr(t.tool, "name", None))
            if tname == name:
                tool_obj = t
                print(f"  - Found matching tool: {tname}", flush=True)
                break

    if tool_obj is None:
        # no tool found -> return informative message
        return {"error": f"Tool '{name}' not found"}

    # try to parse arguments if they are a JSON string
    parsed_kwargs = {}
    if isinstance(raw_args, str):
        try:
            parsed = json.loads(raw_args)
            if isinstance(parsed, dict):
                parsed_kwargs = parsed
            else:
                parsed_kwargs = {"input": parsed}
        except Exception:
            parsed_kwargs = {"input": raw_args}
    elif isinstance(raw_args, dict):
        parsed_kwargs = raw_args
    elif raw_args is not None:
        parsed_kwargs = {"input": raw_args}

    try:
        # For LangChain tools, use invoke() which expects input as keyword args
        if hasattr(tool_obj, "invoke"):
            return tool_obj.invoke(parsed_kwargs)
        elif hasattr(tool_obj, "run"):
            # Some tools might use run() instead
            return tool_obj.run(**parsed_kwargs)
        elif callable(tool_obj):
            return tool_obj(**parsed_kwargs)
        else:
            return {"error": f"Tool '{name}' is not callable"}
    except Exception as e:
        print(f"  Tool execution error: {e}", flush=True)
        return {"error": f"Tool '{name}' raised: {e}"}

def create_agent_graph():
    tools = get_all_tools()
    print(f"Loaded {len(tools)} tools: {[getattr(t, 'name', str(t)) for t in tools]}", flush=True)

  
    tool_executor = None
    if _EXEC_KIND == "ToolExecutor" and _ExecutorClass is not None:
        try:
            tool_executor = _ExecutorClass(tools)
            print(f"Created ToolExecutor", flush=True)
        except Exception as e:
            print(f"Failed to create ToolExecutor: {e}", flush=True)
            tool_executor = None
    elif _EXEC_KIND in ("chat_agent_executor", "create_react_agent") and _executor_factory is not None:
        # try best-effort creation; factory signatures vary, so try a couple forms
        try:
            tool_executor = _executor_factory(tools=tools)
            print(f"Created {_EXEC_KIND} with tools kwarg", flush=True)
        except TypeError:
            try:
                tool_executor = _executor_factory(tools)
                print(f"Created {_EXEC_KIND} with positional arg", flush=True)
            except Exception as e:
                print(f"Failed to create {_EXEC_KIND}: {e}", flush=True)
                tool_executor = None
    
    print(f"Executor kind: {_EXEC_KIND}, tool_executor: {tool_executor}", flush=True)


    api_key_manager = get_api_key_manager()
    api_key = api_key_manager.get_active_key()
    
    if not api_key:
        raise RuntimeError("No Google API key configured. Please set GOOGLE_API_KEY or GOOGLE_API_KEYS environment variable.")
    

    llm = ChatGoogleGenerativeAI(
        model = "gemini-2.5-flash-lite",
        google_api_key=api_key,
        temperature=0
    )
    
    try:
       
        llm_with_tools = llm.bind_tools(tools)
        print(f"Successfully bound {len(tools)} tools using bind_tools()", flush=True)
    except Exception as e1:
        print(f"bind_tools() failed: {e1}", flush=True)
        try:
            # Fallback: use bind with tool descriptions
            llm_with_tools = llm.bind(tools=tools)
            print(f"Successfully bound {len(tools)} tools using bind(tools=...)", flush=True)
        except Exception as e2:
            print(f"bind(tools=...) also failed: {e2}", flush=True)
            print(f"Traceback: {traceback.format_exc()}", flush=True)
            llm_with_tools = llm
            print("WARNING: Falling back to plain LLM without tools", flush=True)

    def call_model(state: AgentState):
        messages = state["messages"]
        
        system_prompt = SystemMessage(content=get_system_prompt())
        
        full_messages = [system_prompt] + messages
        print(f"\n{'='*60}", flush=True)
        print(f"Calling model with {len(full_messages)} messages", flush=True)
        print(f"Last user message: {messages[-1].content if messages else 'None'}", flush=True)
        
        try:
            response = llm_with_tools.invoke(full_messages)
            print(f"Model response received:", flush=True)
            print(f"  - Type: {type(response).__name__}", flush=True)
            print(f"  - Content: {response.content if hasattr(response, 'content') else 'N/A'}", flush=True)
            print(f"  - Has tool_calls: {hasattr(response, 'tool_calls')}", flush=True)
            if hasattr(response, 'tool_calls') and response.tool_calls:
                print(f"  - Tool calls count: {len(response.tool_calls)}", flush=True)
                for tc in response.tool_calls:
                    print(f"    - Call: {getattr(tc, 'name', '?')} with args: {getattr(tc, 'args', '?')}", flush=True)
            else:
                print(f"  - No tool calls in response", flush=True)
            print(f"{'='*60}\n", flush=True)
            return {"messages": [response]}
        except Exception as exc:
            print(f"Model invoke exception: {repr(exc)}", flush=True)
            traceback.print_exc()
            try:
                response = llm_with_tools(full_messages) if callable(llm_with_tools) else AIMessage(content=f"Error invoking model: {exc}")
            except Exception as exc2:
                print(f"Model fallback exception: {repr(exc2)}", flush=True)
                traceback.print_exc()
                response = AIMessage(content=f"Error invoking model: {exc2}")
        
        return {"messages": [response]}
    
    def call_tools(state: AgentState):
        last_message = state["messages"][-1]
        tool_calls = getattr(last_message, "tool_calls", None) or []
        
        print(f"\ncall_tools called:", flush=True)
        print(f"  - last_message type: {type(last_message).__name__}", flush=True)
        print(f"  - tool_calls count: {len(tool_calls)}", flush=True)
        if tool_calls:
            print(f"  - First tool_call type: {type(tool_calls[0])}", flush=True)
            print(f"  - First tool_call: {tool_calls[0]}", flush=True)
        
        if not tool_calls:
            print("  - No tool calls found, returning empty", flush=True)
            return {"messages": []}
        
        responses = []
        for tool_call in tool_calls:
            print(f"\n  Executing tool_call: {tool_call}", flush=True)
            # prefer langgraph executor if present
            if tool_executor is not None and hasattr(tool_executor, "invoke"):
                try:
                    tool_result = tool_executor.invoke(tool_call)
                    print(f"  Tool executor result: {tool_result}", flush=True)
                except Exception as e:
                    print(f"  Tool executor error: {e}, falling back to manual", flush=True)
                    tool_result = _manual_invoke_tool(tools, tool_call)
            else:
                tool_result = _manual_invoke_tool(tools, tool_call)
            print(f"  Tool final result: {tool_result}", flush=True)
            responses.append(ToolMessage(content=str(tool_result), tool_call_id=getattr(tool_call, 'id', 'unknown')))
        
        return {"messages": responses}
    
    def should_continue(state: AgentState):
        last_message = state["messages"][-1]
        
        # If last message has tool calls, execute them
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            print(f"should_continue: Found tool calls, routing to 'tools'", flush=True)
            return "tools"
        
        # Otherwise end (go to END)
        print(f"should_continue: No tool calls, ending flow", flush=True)
        return "end"
    
    workflow = StateGraph(AgentState)
    
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", call_tools)
    
    workflow.set_entry_point("agent")
    
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    
    workflow.add_edge("tools", "agent")
    
    app = workflow.compile()
    
    return app
