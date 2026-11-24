# ADR 0002 — MSW e Socket.IO

## Status

Aceito.

## Contexto

O desafio exige MSW na camada de rede e eventos exercitando `socket.io-client`. Não pode haver setters diretos na UI para simular tempo real.

## Decisão

Usar MSW 2 para REST e WebSocket, com `@mswjs/socket.io-binding` para codificar/decodificar o protocolo Socket.IO. O cliente importa `socket.io-client` dinamicamente após `worker.start()`.

## Consequências

- Componentes e hooks não conhecem fixtures ou caminhos alternativos.
- O handler WebSocket casa com a raiz porque o MSW remove `/socket.io/` antes do match.
- Eventos do servidor simulado usam `io.client.emit(...)`.
- Rooms, namespaces e broadcast completo não são suportados pelo binding.
- A integração é validada por Playwright desktop e mobile.
