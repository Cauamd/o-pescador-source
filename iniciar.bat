@echo off
rem Inicia o jogo mesmo quando a pasta esta em um caminho de rede (\\servidor\...).
rem O pushd mapeia o caminho UNC para uma letra de unidade temporaria.
pushd "%~dp0"
echo Abrindo O Pescador em http://localhost:8080  (Ctrl+C para parar)
start "" http://localhost:8080
node scripts\serve.mjs
popd
pause
