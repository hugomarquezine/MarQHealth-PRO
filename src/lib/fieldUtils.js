/**
 * Utilitários para verificar se campos estão vazios
 */

/**
 * Verifica se um valor está vazio (null, undefined, string vazia, 'N/A', 'NULL', 'NEHUM', etc.)
 * @param {any} value - O valor a ser verificado
 * @returns {boolean} - true se o campo estiver vazio, false caso contrário
 */
export function isFieldEmpty(value) {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    return trimmedValue === '' || 
           trimmedValue.toLowerCase() === 'n/a' || 
           trimmedValue.toLowerCase() === 'null' || 
           trimmedValue.toLowerCase() === 'nehum' || 
           trimmedValue.toLowerCase() === 'nenhum' ||
           trimmedValue.toLowerCase() === 'não informado' ||
           trimmedValue.toLowerCase() === 'nao informado' ||
           trimmedValue.toLowerCase() === 'não' ||
           trimmedValue.toLowerCase() === 'nao';
  }
  
  if (typeof value === 'boolean') {
    return false; // boolean false não é considerado vazio
  }
  
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Verifica se um campo deve ser exibido baseado no valor
 * @param {any} value - O valor a ser verificado
 * @returns {boolean} - true se o campo deve ser exibido, false caso contrário
 */
export function shouldShowField(value) {
  return !isFieldEmpty(value);
}

/**
 * Formata um valor para exibição, retornando null se estiver vazio
 * @param {any} value - O valor a ser formatado
 * @returns {string|null} - O valor formatado ou null se estiver vazio
 */
export function formatFieldValue(value) {
  if (isFieldEmpty(value)) {
    return null;
  }
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  return value;
}
