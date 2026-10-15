# Instalação do Sistema de Compras no Windows

Este guia explica como instalar e abrir o Sistema de Compras em um computador
Windows. O Node.js **não precisa ser instalado no computador do usuário**: o
pacote já inclui o runtime necessário.

## Arquivo de instalação

O pacote é gerado na máquina de desenvolvimento em:

```text
release\Sistema-de-Compras-Setup-win-x64.zip
```

Copie esse ZIP para o computador onde o sistema será instalado. O arquivo
contém `install.bat` e a pasta `app`.

## Instalar

1. Copie o ZIP para uma pasta local do computador, por exemplo, `Downloads`.
2. No Explorador de Arquivos, clique com o botão direito no ZIP e escolha
   **Extrair Tudo...**.
3. Escolha uma pasta de destino e clique em **Extrair**.
4. Abra a pasta extraída. Confirme que ela contém `install.bat` e a pasta
   `app`.
5. Execute `install.bat`. Se o Windows perguntar, confirme a execução.
6. Aguarde a instalação. O navegador padrão abrirá o sistema.

O instalador cria atalhos para o Menu Iniciar e para a Área de Trabalho. Para
abrir o sistema novamente, use o atalho **Sistema de Compras**.

## O ZIP aparece vazio ou não abre?

O pacote usa o formato ZIP padrão do Windows. Se o Explorador de Arquivos não
mostrar o conteúdo:

1. Confirme que o download terminou e que o tamanho do arquivo não é zero.
2. Copie o ZIP para o disco local antes de tentar abrir ou extrair; não o abra
   diretamente de um anexo de e-mail, navegador ou pasta de rede.
3. Tente **Extrair Tudo...** pelo menu de contexto, em vez de abrir o ZIP com
   duplo clique.
4. Se ainda não funcionar, tente extrair com uma versão atualizada do 7-Zip.
5. Se o Windows informar que o arquivo está bloqueado, clique com o botão
   direito no ZIP, abra **Propriedades** e, se aparecer, marque **Desbloquear**;
   depois tente extrair novamente.

Após a extração, `install.bat` deve ficar visível ao lado da pasta `app`. Não
execute o instalador de dentro do visualizador do ZIP.

## Local de instalação e dados

- Arquivos do programa:
  `%LOCALAPPDATA%\Programs\Sistema de Compras`
- Banco SQLite e dados cadastrados:
  `%LOCALAPPDATA%\SistemaCompras\data\app.sqlite`
- Endereço local:
  `http://127.0.0.1:4317`

O banco fica separado dos arquivos do programa. Reinstalar ou atualizar os
binários não deve apagar os dados cadastrados. Para fazer backup, feche o
sistema e copie `app.sqlite` para um local seguro.

## Problemas ao iniciar

- Se aparecer uma mensagem informando que a porta `4317` já está em uso,
  feche outra instância do Sistema de Compras e tente novamente.
- Se o navegador não abrir automaticamente, digite
  `http://127.0.0.1:4317` na barra de endereços.
- A aplicação deve ser usada localmente no próprio computador; não exponha a
  porta do serviço à rede.

## Para quem prepara o pacote

Em uma máquina Windows de desenvolvimento com Node.js 24 ou posterior, execute
na raiz do projeto:

```powershell
.\deploy\build-release.ps1
```

O script compila o frontend e o backend e gera o ZIP de instalação em `release`.
