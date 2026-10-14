/**
 * Función para centralizar el modelo a usar en el proyecto
 *
 * También agregué otras opciones si lo quieres cambiar
 */

// Groq:
// npm i @ai-sdk/groq

// Anthropic:
// npm i @ai-sdk/anthropic

// OpenAI:
// npm i @ai-sdk/openai

// Gemini:
// npm i @ai-sdk/google

// Ollama:
// npm i ollama-ai-provider-v2
// A diferencia de los anteriores, este es un proveedor comunitario.
import { ollama } from 'ollama-ai-provider-v2';

// Groq:
// export const model = groq('openai/gpt-oss-20b');
// export const model = groq('openai/gpt-oss-120b');

// Anthropic:
// export const model = anthropic('claude-haiku-4-5');

// OpenAI:
// export const model = openai('gpt-5-mini');

// Gemini:
// export const model = google('gemini-2.5-flash');

// Ollama:
// export const model = ollama('gemma4:12b');
export const model = ollama('qwen3.5:4b');
