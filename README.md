# Ferrari 12Cilindri — Projeto de Fã (TCC)

> ⚠️ Projeto acadêmico não-oficial, criado por fã, sem vínculo com a Ferrari S.p.A. Todas as marcas, nomes e imagens da Ferrari pertencem aos seus respectivos donos e são usadas aqui apenas para fins educacionais/demonstrativos.

Site estático inspirado no configurador oficial da Ferrari, desenvolvido como projeto de conclusão do curso de Desenvolvimento de Sistemas.

🔗 **Demo:** https://vinicius8654.github.io/Project-Ferrari-12cilindri/

## Funcionalidades

- Página inicial com vídeo hero e navegação por seções
- Efeito "raio-x" interativo revelando o interior do carro
- Galeria de fotos e vídeos organizada por álbuns
- Player de áudio simulando o som do motor
- Mapa interativo de concessionárias (Leaflet + OpenStreetMap)
- Páginas de detalhe: interior, aerodinâmica, especificações técnicas

## Tecnologias

- HTML5, CSS3, JavaScript (vanilla)
- [Leaflet.js](https://leafletjs.com/) para o mapa
- [Font Awesome](https://fontawesome.com/) para ícones
- Mídia hospedada via Cloudinary
- ESLint + Prettier para padronização de código

## Como rodar localmente

```bash
git clone https://github.com/vinicius8654/Project-Ferrari-12cilindri.git
cd Project-Ferrari-12cilindri
npx http-server .
```

Depois acesse o endereço mostrado no terminal (ex: `http://localhost:8080`).

> O projeto **não precisa** de `npm install` para funcionar — as dependências no `package.json` são apenas ferramentas de desenvolvimento (lint/formatação), opcionais.

## Estrutura do projeto

```
├── css/                  # estilos adicionais
├── js/                   # scripts adicionais
├── models/12c/           # assets do modelo 3D
├── index.html            # página principal
├── configurator.html     # configurador
├── 3dmodel.html          # visualizador 3D
├── dealers.json           # dados das concessionárias (mapa)
└── ...                    # páginas de detalhe (interior, aerodinâmica, etc.)
```

## Dependências externas

Todo o conteúdo de mídia (imagens, vídeos, áudio) é hospedado externamente no [Cloudinary](https://cloudinary.com/), conta `dmxgurkfj`. Isso mantém o repositório leve, mas cria uma dependência única: se essa conta for removida ou os links expirarem, a mídia correspondente para de carregar.

**Mitigação implementada**: `app.js` detecta falhas de carregamento de imagem/vídeo/áudio e aplica um fallback visual, evitando que a página quebre.

**Não resolvido**: se o Cloudinary cair definitivamente, seria necessário re-hospedar os arquivos e atualizar as URLs no HTML — isso está fora do escopo desta correção.

## Sistema de login e perfil (login.html / perfil.html)

Fluxo de autenticação funcional, mas totalmente simulado no navegador via
`localStorage` — não há backend real.

- **Funciona**: cadastro, login, redirecionamento pós-login, exibição de
  perfil e cores favoritas.
- **Limitação conhecida**: senhas em texto puro no `localStorage`. Aceitável
  para fins acadêmicos, não deve ser referência de segurança real.
- **Incompleto**: a estrutura de dados já prevê "carros favoritos", mas não
  há interface para exibi-los (só cores).

## Autor

Desenvolvido por [vinicius8654](https://github.com/vinicius8654).
