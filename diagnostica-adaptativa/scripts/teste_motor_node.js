// Roda o teste de aceitação do porte no Node: node scripts/teste_motor_node.js
const fs = require("fs");
const path = require("path");
const raiz = path.join(__dirname, "..");
const ler = f => JSON.parse(fs.readFileSync(path.join(raiz, f), "utf-8"));

const MotorDiag = require(path.join(raiz, "js", "motor.js"));
const { verificar } = require(path.join(raiz, "js", "teste_motor.js"));

const r = verificar(MotorDiag, ler("banco/itens.json").itens, ler("banco/matriz.json"), ler("teste/teste_motor.json").casos);
console.log(r.linhas.join("\n"));
process.exit(r.ok ? 0 : 1);
