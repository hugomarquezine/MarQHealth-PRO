# Demonstração das Funções Utilitárias para Campos Vazios

## Como Funciona

As funções criadas verificam se um campo está vazio e deve ser ocultado da interface. Elas consideram os seguintes valores como "vazios":

- `null` ou `undefined`
- Strings vazias (`""`)
- Strings com apenas espaços em branco (`"   "`)
- Valores como: `"N/A"`, `"NULL"`, `"NEHUM"`, `"Nenhum"`, `"Não informado"`, `"Nao informado"`, `"Não"`, `"Nao"`
- Arrays vazios (`[]`)
- Objetos vazios (`{}`)

## Exemplos de Uso

### Dados de Exemplo do Paciente

```javascript
const patientData = {
  name: "Maria Silva",           // ✓ Será exibido
  phone: "N/A",                  // ✗ Será oculto
  email: "maria@email.com",      // ✓ Será exibido
  address: "",                   // ✗ Será oculto
  gender: "Feminino",            // ✓ Será exibido
  instagram: "NEHUM",            // ✗ Será oculto
  observations: "   ",           // ✗ Será oculto (apenas espaços)
  hasAllergies: false,           // ✓ Será exibido (boolean false não é vazio)
  treatments: []                 // ✗ Será oculto (array vazio)
};
```

### Resultado na Interface

**Antes (mostrando campos vazios):**
- Nome: Maria Silva
- Telefone: N/A
- Email: maria@email.com
- Endereço: N/A
- Gênero: Feminino
- Instagram: N/A
- Observações: N/A
- Alergias: Não
- Tratamentos: Nenhum

**Depois (ocultando campos vazios):**
- Nome: Maria Silva
- Email: maria@email.com
- Gênero: Feminino
- Alergias: Não

## Funções Implementadas

### `isFieldEmpty(value)`
Retorna `true` se o campo estiver vazio, `false` caso contrário.

### `shouldShowField(value)`
Retorna `true` se o campo deve ser exibido, `false` se deve ser oculto.

### `formatFieldValue(value)`
Retorna o valor formatado ou `null` se estiver vazio.

## Benefícios

1. **Interface mais limpa**: Remove campos desnecessários da visualização
2. **Melhor experiência do usuário**: Foca apenas nas informações relevantes
3. **Flexibilidade**: Fácil de configurar quais valores são considerados vazios
4. **Manutenibilidade**: Centraliza a lógica de verificação de campos vazios
