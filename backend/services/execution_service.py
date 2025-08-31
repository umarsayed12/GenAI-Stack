from sqlalchemy.orm import Session
from models.stack import Stack
from services.knowledge_service import query_collection
from services.gemini_service import get_gemini_response
import json
from collections import defaultdict, deque

def execute_workflow(stack_id: int, user_query: str, db: Session):
    db_stack = db.query(Stack).filter(Stack.id == stack_id).first()
    if not db_stack or not db_stack.workflow_data:
        raise ValueError("Workflow not found or is empty.")

    workflow = db_stack.workflow_data
    nodes = {node['id']: node for node in workflow.get('nodes', [])}
    edges = workflow.get('edges', [])
    indegree = {node_id: 0 for node_id in nodes}
    graph = defaultdict(list)

    for edge in edges:
        graph[edge['source']].append(edge['target'])
        indegree[edge['target']] += 1

    queue = deque([nid for nid, deg in indegree.items() if deg == 0])
    topo_order = []

    while queue:
        nid = queue.popleft()
        topo_order.append(nid)
        for nei in graph[nid]:
            indegree[nei] -= 1
            if indegree[nei] == 0:
                queue.append(nei)
    node_outputs = {}
    final_result = "Execution did not produce a final output."

    for current_node_id in topo_order:
        node = nodes[current_node_id]
        node_type = node.get('type')
        node_data = node.get('data', {})

        if node_type == 'userQuery':
            node_outputs[current_node_id] = {'query': user_query}

        elif node_type == 'knowledgeBase':
            input_query = ""
            for edge in edges:
                if edge['target'] == current_node_id:
                    source_node_output = node_outputs.get(edge['source'], {})
                    input_query = source_node_output.get('query', "")
                    break

            collection_name = node_data.get('collectionName')
            if not collection_name:
                node_outputs[current_node_id] = {'context': ""}
            else:
                user_embedding_api_key = node_data.get('apiKey')
                context_list = query_collection(
                    collection_name,
                    input_query,
                    api_key=user_embedding_api_key if user_embedding_api_key else None
                )
                context = "\n\n".join(context_list)
                node_outputs[current_node_id] = {'context': context}

        elif node_type == 'llm':
            llm_input_query = ""
            llm_input_context = ""
            for edge in edges:
                if edge['target'] == current_node_id:
                    source_output = node_outputs.get(edge['source'], {})
                    if edge['targetHandle'] == 'context':
                        llm_input_query = source_output.get('query', "")
                    elif edge['targetHandle'] == 'query':
                        llm_input_context = source_output.get('context', "")
            prompt_template = node_data.get('prompt', "User Query: {query}")
            final_prompt = (
                prompt_template.replace("{context}", llm_input_context)
                               .replace("{query}", llm_input_query)
            )
            user_api_key = node_data.get('apiKey')

            response_text = get_gemini_response(
                final_prompt,
                api_key=user_api_key if user_api_key else None
            )
            node_outputs[current_node_id] = {'output': response_text}

        elif node_type == 'output':
            for edge in edges:
                if edge['target'] == current_node_id:
                    source_output = node_outputs.get(edge['source'], {})
                    final_result = source_output.get('output', "No output from connected node.")
                    break
            node_outputs[current_node_id] = {'final_result': final_result}

    return final_result
