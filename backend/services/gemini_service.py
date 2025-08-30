import google.generativeai as genai
from core.config import GEMINI_API_KEY




def get_gemini_response(prompt: str, api_key:str | None = None) -> str:
    try:
        genai.configure(api_key=api_key if api_key else GEMINI_API_KEY)
        generation_config = {
            "temperature": 0.9,
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 2048,

        }
        model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config
)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating response: {e}")
        return "Sorry, I couldn't process your request."