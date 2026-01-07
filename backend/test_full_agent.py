#!/usr/bin/env python3
"""
Test the full agent graph with tool execution
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.agent.graph import create_agent_graph
from app.agent.tools import set_db_session
from app.database import get_db
from langchain_core.messages import HumanMessage

print("=" * 80)
print("FULL AGENT GRAPH TEST")
print("=" * 80)

# Setup database
try:
    db_gen = get_db()
    db = next(db_gen)
    set_db_session(db)
    print("[OK] Database connected")
except Exception as e:
    print(f"[ERROR] Database error: {e}")
    sys.exit(1)

# Create agent
try:
    agent = create_agent_graph()
    print("[OK] Agent graph created")
except Exception as e:
    print(f"[ERROR] Agent creation error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test task creation
print("\nTest: 'Create a task to buy milk'")
print("-" * 80)
try:
    state = {"messages": [HumanMessage(content="Create a task to buy milk")]}
    result = agent.invoke(state)
    
    print(f"\nResult messages count: {len(result['messages'])}")
    for i, msg in enumerate(result['messages']):
        msg_type = type(msg).__name__
        content = msg.content if hasattr(msg, 'content') else str(msg)
        content_preview = content[:100] if content else "(empty)"
        print(f"  {i+1}. {msg_type}: {content_preview}")
    
    # Find final response
    final_response = ""
    for msg in reversed(result["messages"]):
        if type(msg).__name__ == 'AIMessage' and hasattr(msg, 'content') and msg.content:
            final_response = msg.content
            break
    
    if final_response:
        print(f"\n[OK] Final agent response: {final_response}")
    else:
        print(f"\n[ERROR] No final agent response found!")
        
except Exception as e:
    print(f"[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("END OF TEST")
print("=" * 80)
