import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
import google.generativeai as genai
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = FastAPI(title="UML Activity Agent API")

# Configurar CORS para Angular (puerto 4200 por defecto)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar Gemini
API_KEY = os.getenv("GOOGLE_API_KEY")
if API_KEY and API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

# Modelos de datos
class DiagramState(BaseModel):
    cells: List[Any]

class AIRequest(BaseModel):
    prompt: str
    state: Optional[DiagramState] = None

@app.get("/health")
def health_check():
    return {"status": "ok", "gemini_configured": model is not None}

@app.post("/generate")
async def generate_commands(request: AIRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured. Please set GOOGLE_API_KEY in .env")

    # Prompt del sistema para el generador de acciones UML
    system_prompt = """
    Eres un Arquitecto de Software experto en Diagramas de Actividad con Carriles (Swimlanes).
    Tu tarea es transformar el requerimiento del usuario en una secuencia de COMANDOS JSON.
    
    Formatos de respuesta permitidos:
    1. CREATE_LANE: { "action": "CREATE_LANE", "name": "Nombre", "x": 0, "y": 0, "width": 200 }
    2. CREATE_NODE: { "action": "CREATE_NODE", "type": "activity|decision|initial|final|fork|join", "name": "Texto", "laneId": "id", "x": 50, "y": 50 }
    3. CONNECT: { "action": "CONNECT", "from": "id1", "to": "id2", "label": "opcional" }
    4. MOVE: { "action": "MOVE", "id": "id", "x": 100, "y": 100 }
    5. DELETE: { "action": "DELETE", "id": "id" }
    
    REGLA MÁXIMA: Responde EXCLUSIVAMENTE con un array JSON de comandos. No escribas nada más.
    Si el usuario pide un diagrama completo, genera primero los carriles, luego los nodos y finalmente las conexiones.
    """

    try:
        full_prompt = f"{system_prompt}\n\nREQUERIMIENTO: {request.prompt}\n\nESTADO ACTUAL: {request.state.json() if request.state else 'Vacio'}"
        response = model.generate_content(full_prompt)
        
        # Aquí eventualmente agregaremos un parser de JSON robusto
        return {"commands": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
