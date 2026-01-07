#!/usr/bin/env python3
"""
Diagnostic script to test if tool binding works with Gemini
"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from app.agent.tools import get_all_tools
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage

# Load env
from dotenv import load_dotenv
load_dotenv()

print("=" * 80)
print("TOOL BINDING DIAGNOSTIC TEST")
print("=" * 80)

# Get tools
tools = get_all_tools()
print(f"\n1. Loaded {len(tools)} tools:")
for t in tools:
    print(f"   - {t.name}: {t.description[:60]}...")

# Create LLM
print(f"\n2. Creating Gemini LLM model...")
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=os.getenv("GOOGLE_API_KEY"),
    temperature=0
)

# Try to bind tools
print(f"\n3. Attempting to bind tools...")
try:
    llm_with_tools = llm.bind_tools(tools)
    print(f"   ✓ bind_tools() succeeded")
except Exception as e:
    print(f"   ✗ bind_tools() failed: {e}")
    try:
        llm_with_tools = llm.bind(tools=tools)
        print(f"   ✓ bind(tools=...) succeeded")
    except Exception as e2:
        print(f"   ✗ bind(tools=...) also failed: {e2}")
        llm_with_tools = llm
        print(f"   → Falling back to plain LLM")

# Test with actual user message
print(f"\n4. Testing with user message: 'Create a task to buy milk'")
messages = [
    SystemMessage(content="You are a helpful task manager. Use the tools to help users."),
    HumanMessage(content="Create a task to buy milk")
]

try:
    response = llm_with_tools.invoke(messages)
    print(f"   Response type: {type(response).__name__}")
    print(f"   Has tool_calls: {hasattr(response, 'tool_calls')}")
    if hasattr(response, 'tool_calls'):
        print(f"   Tool calls: {response.tool_calls}")
        if response.tool_calls:
            print(f"   ✓ Tool was called!")
        else:
            print(f"   ✗ No tool calls (empty list)")
    print(f"   Content: {response.content[:100]}...")
except Exception as e:
    print(f"   ✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("END OF DIAGNOSTIC")
print("=" * 80)
