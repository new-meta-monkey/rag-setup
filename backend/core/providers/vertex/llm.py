"""
Vertex AI LLM Provider
"""
from typing import List, Optional, Dict, Any
import json
from backend.core.providers.base.llm_provider import LLMProvider


class VertexLLMProvider(LLMProvider):
    """Vertex AI implementation of LLMProvider using Gemini models"""
    
    def __init__(
        self,
        project_id: str,
        location: str = "us-central1",
        model_name: str = "gemini-1.5-flash",
        credentials_json: Optional[str] = None
    ):
        self.project_id = project_id
        self.location = location
        self.model_name = model_name
        self.credentials_json = credentials_json
        self._model = None
        
    def _initialize(self):
        """Initialize Vertex AI SDK (lazy loading)"""
        if self._model is not None:
            return
            
        try:
            import vertexai
            from vertexai.preview.generative_models import GenerativeModel
            from google.oauth2 import service_account
            
            credentials = None
            if self.credentials_json:
                try:
                    service_account_info = json.loads(self.credentials_json)
                    credentials = service_account.Credentials.from_service_account_info(service_account_info)
                except Exception as e:
                    print(f"Failed to parse Vertex credentials JSON: {e}")
            
            vertexai.init(project=self.project_id, location=self.location, credentials=credentials)
            self._model = GenerativeModel(self.model_name)
        except Exception as e:
            print(f"Failed to initialize Vertex AI: {e}")
            raise RuntimeError(f"Failed to initialize Vertex AI. Error: {e}")
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate a response from the LLM"""
        if self._model is None:
            self._initialize()
            
        if not self._model:
            raise RuntimeError("Vertex AI model not initialized")
        
        # Combine system and user prompts
        full_prompt = prompt
        if system_prompt:
            full_prompt = f"{system_prompt}\n\n{prompt}"
        
        # Generate response
        generation_config = {
            "temperature": temperature,
        }
        if max_tokens:
            generation_config["max_output_tokens"] = max_tokens
        
        response = self._model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        # Handle response with proper error checking
        # IMPORTANT: Don't access response.text directly as it raises ValueError if empty
        try:
            # Check if response was blocked by safety filters
            if hasattr(response, 'prompt_feedback'):
                feedback = response.prompt_feedback
                if hasattr(feedback, 'block_reason') and feedback.block_reason:
                    raise RuntimeError(f"Response blocked by safety filters: {feedback.block_reason}")
            
            # Check candidates first (before accessing .text which can raise ValueError)
            if not hasattr(response, 'candidates') or not response.candidates:
                raise RuntimeError("Model returned no candidates. Response may have been blocked.")
            
            candidate = response.candidates[0]
            
            # Check if candidate has content
            if not hasattr(candidate, 'content') or not candidate.content:
                raise RuntimeError("Candidate has no content.")
            
            # Check if content has parts
            if not hasattr(candidate.content, 'parts') or not candidate.content.parts:
                # Check finish reason
                finish_reason = getattr(candidate, 'finish_reason', None)
                if finish_reason:
                    raise RuntimeError(f"Model returned empty response. Finish reason: {finish_reason}")
                raise RuntimeError("Model returned empty response (no content parts).")
            
            # Extract text from first part
            first_part = candidate.content.parts[0]
            if hasattr(first_part, 'text'):
                return first_part.text
            else:
                raise RuntimeError("Response part has no text attribute.")
            
        except (AttributeError, IndexError) as e:
            raise RuntimeError(f"Unexpected response format from Vertex AI: {e}")
    
    def validate_api_key(self) -> bool:
        """Validate the API key/credentials for this provider"""
        try:
            self.generate("Hello", max_tokens=5)
            return True
        except Exception:
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        return {
            "provider": "vertex",
            "model_name": self.model_name,
            "project_id": self.project_id,
            "location": self.location
        }
