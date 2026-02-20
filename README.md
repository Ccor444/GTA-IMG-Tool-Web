# GTA IMG Tool Web

<div align="center">
  <img src="assets/icon.svg" width="64" height="64" alt="GTA IMG Tool">
  <h3>A web-based tool for viewing and editing GTA IMG archive files</h3>
  <p><i>GTA III, Vice City, and San Andreas</i></p>
</div>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version 1.0.0">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="MIT License">
  <img src="https://img.shields.io/badge/platform-web-orange.svg" alt="Platform: Web">
</p>

## 📋 Sobre

GTA IMG Tool Web é uma ferramenta para visualizar e editar arquivos IMG dos jogos Grand Theft Auto (GTA III, Vice City e San Andreas). Esta versão web foi desenvolvida em JavaScript puro (sem frameworks) e roda diretamente no navegador.

Baseada na versão original em C#/WPF desenvolvida por Vaibhav Pandey (VPZ), esta ferramenta oferece as mesmas funcionalidades em uma interface moderna e acessível.

## ✨ Funcionalidades

- **Abrir arquivos IMG** - Suporte para VER1 (GTA III/VC) e VER2 (GTA SA)
- **Drag & Drop** - Arraste arquivos .img diretamente para a janela
- **Visualização em tabela** - Lista todos os arquivos com nome, tipo, tamanho e offset
- **Filtro de busca** - Encontre arquivos rapidamente
- **Seleção múltipla** - Ctrl+Click e Shift+Click para selecionar vários arquivos
- **Importar arquivos** - Adicione novos arquivos ao archive
- **Exportar** - Extraia arquivos individuais ou todos de uma vez
- **Deletar** - Remova arquivos do archive
- **Renomear** - Altere nomes de arquivos
- **Substituir** - Troque o conteúdo mantendo o nome
- **Pack** - Desfragmente o archive para remover espaços vazios
- **Interface moderna** - Tema escuro, menus dropdown, toolbar com ícones

## 🎮 Formatos Suportados

| Versão | Jogos | Arquivos |
|--------|-------|----------|
| VER1 | GTA III, GTA Vice City | .img + .dir |
| VER2 | GTA San Andreas | .img (único) |

## 🚀 Como Usar

1. **Acesse**: [https://ccor444.github.io/GTA-IMG-Tool-Web/)
2. **Ou localmente**:
   ```bash
   git clone [https://ccor444.github.io/GTA-IMG-Tool-Web//)
   cd gtaimg
   # Abra o index.html no seu navegador
