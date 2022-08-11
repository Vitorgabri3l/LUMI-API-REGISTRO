const mongoose = require('mongoose')

const User = mongoose.model('User',{
   nome: String,
   sobrenome: String,
   email: String,
   cpf: String,
   senha: String,
   dataNasc: String,
   celular: String
})

module.exports = User