import pytest
from app.agent.graph import create_agent_graph
from app.agent.tools import set_db_session
from app.database import SessionLocal
from langchain.schema import HumanMessage

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def agent(db_session):
    set_db_session(db_session)
    return create_agent_graph()

def test_create_task(agent):
    """Test creating a task via natural language"""
    state = {
        "messages": [HumanMessage(content="Add a task to buy milk tomorrow")]
    }
    
    result = agent.invoke(state)
    final_message = result["messages"][-1].content
    
    assert "created" in final_message.lower() or "added" in final_message.lower()

def test_list_tasks(agent):
    """Test listing tasks"""
    state = {
        "messages": [HumanMessage(content="Show me all my tasks")]
    }
    
    result = agent.invoke(state)
    final_message = result["messages"][-1].content
    
    assert "task" in final_message.lower()

def test_update_task(agent, db_session):
    """Test updating a task"""
    # First create a task
    state1 = {
        "messages": [HumanMessage(content="Add a task to test updates")]
    }
    agent.invoke(state1)
    
    # Then update it
    state2 = {
        "messages": [HumanMessage(content="Mark the test updates task as done")]
    }
    
    result = agent.invoke(state2)
    final_message = result["messages"][-1].content
    
    assert "updated" in final_message.lower() or "marked" in final_message.lower()

def test_filter_tasks(agent):
    """Test filtering tasks by priority"""
    state = {
        "messages": [HumanMessage(content="Show me all high priority tasks")]
    }
    
    result = agent.invoke(state)
    final_message = result["messages"][-1].content
    
    assert "task" in final_message.lower() or "found" in final_message.lower()

def test_delete_task(agent, db_session):
    """Test deleting a task"""
    # First create a task
    state1 = {
        "messages": [HumanMessage(content="Add a task to delete later")]
    }
    agent.invoke(state1)
    
    # Then delete it
    state2 = {
        "messages": [HumanMessage(content="Delete the task about delete later")]
    }
    
    result = agent.invoke(state2)
    final_message = result["messages"][-1].content
    
    assert "deleted" in final_message.lower() or "removed" in final_message.lower()
