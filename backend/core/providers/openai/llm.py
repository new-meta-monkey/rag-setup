"""
OpenAI LLM Provider
"""
from typing import Optional, Dict, Any
from backend.core.providers.base.llm_provider import LLMProvider


class OpenAILLMProvider(LLMProvider):
    """OpenAI implementation of LLMProvider"""
    
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name
        self._client = None
        
    def _initialize(self):
        """Initialize OpenAI client (lazy loading)"""
        if self._client is not None:
            return
            
        try:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize OpenAI client. Error: {e}")
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        **kwargs
    ) -> str:
        """Generate a response from the LLM"""
        if self._client is None:
            self._initialize()
            
        if not self._client:
            raise RuntimeError("OpenAI client not initialized")
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        # Call OpenAI API
        response = self._client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return response.choices[0].message.content
    
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
            "provider": "openai",
            "model_name": self.model_name
        }
