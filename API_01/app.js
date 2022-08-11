//imports
require('dotenv').config()
const express = require ('express')
const mongoose = require ('mongoose')
const bcrypt = require ('bcrypt')
const jwt = require ('jsonwebtoken')
const crypto = require('crypto')
const app = express()
const nodemailer = require('nodemailer')
const cpfCnpj =  require ('cpf-cnpj-validator')



//CONFIGURE JSON RESPONSE
app.use(express.json())

//models
const User = require('./app/models/User')
const { response } = require('express')

//private route
app.get('/user/:id', async (req, res) => {
   const id = req.params.id

   //check user exists
   const user = await User.findById(id, '-senha')
   
   if (!user){
      return res.status(404).json ({msg: 'Usuário não encontrado!'})
   }

   res.status(200).json({ user })
})


function checkToken(req, res, next){

   const authHeader = req.headers['authorization']
   const token = authHeader && authHeader.split(" ")[1]

   if (!token){
      return res.status(401).json({msg: 'acesso negado!'})
   }  
}

//registrar usuario 
app.post('/auth/register', async(req, res) => {
 
const { nome, sobrenome, email, cpf, senha, confirmarSenha, dataNasc, celular } = req.body

     //valdidação
     if(!nome) {
        return res.status(422).json({ msg: 'o nome é obrigatório!'})
     }

     if(!sobrenome) {
        return res.status(422).json({ msg: 'o sobrenome é obrigatório!'})
     }

     if(!email) {
        return res.status(422).json({ msg: 'o email é obrigatório!'})
     }

     if(!cpf) {
        return res.status(422).json({ msg: 'o CPF é obrigatório!'}) 
     }
     

     if(!senha) {
        return res.status(422).json({ msg: 'a senha é obrigatória!'})
     }

     if(senha !== confirmarSenha) {
        return res.status(422).json({ msg: 'as senhas não conferem!'})
     }

   //verificação se usuario existe

   const emailExists = await User.findOne({email: email }) 
   if (emailExists){
   return res.status(422).json({ msg: 'E-mail já cadastrado!'})
   }

   const cpfExists = await User.findOne({cpf: cpf }) 
   if (cpfExists){
      return res.status(422).json({ msg: 'CPF já cadastrado!'})
   }
  //criando password
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(senha, salt)

  //creater user
  const user = (User)({
     nome,
     sobrenome,
     email,
     cpf,
     senha: passwordHash,
     dataNasc,
     celular
     
   })
   
   try {
      await user.save ()
      
      res.status(201).json({
         msg: 'usuario cadastrado com sucesso'})
         
      } catch (error) {
         console.log(error)
         
         res.status(500).json({
            msg: 'aconteceu um erro no sevidor. Tente novamente mais tarde!'})
         }
      });
         
         
         //login User
   app.post("/auth/login", async (req, res) => {
    const { email, senha } = req.body

    //validação
   if(!email) {
      return res.status(422).json({ msg: 'o email é obrigatório!'})
   }

   if(!senha) {
      return res.status(422).json({ msg: 'a senha é obrigatória!'})
   }

   //check existencia do usuario 
   const user = await User.findOne({email: email }) 
   if (!user){
      return res.status(404).json({ msg: 'Usuário não cadastrado!'})
   }

   //check senha
   const checkPassword = await bcrypt.compare(senha, user.senha)

   if(!checkPassword) {
      return res.status(422).json({ msg: 'senha inválida!'})
   }


   try{
      const secret = process.env.SECRET

      const token = jwt.sign({
         id: user._id,
      },
        secret,
   )
   
   res.status(200).json({ msg: 'AUTENTICAÇÃO REALIZADA COM SUCESSO', token })

   } catch(err) {
      console.log(error)

      res.status(500).json({
         msg: 'aconteceu um erro no sevidor. Tente novamente mais tarde!'})
     
   }

   })

//credenciais 
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose
.connect(
`mongodb+srv://${dbUser}:${dbPassword}@cluster0.3ldxk.mongodb.net/?retryWrites=true&w=majority`)
.then(() => {
    app.listen(3000)
    console.log ('conectou com o banco!')
})
.catch((err) => console.log(err))

//recuperar senha
app.post("/recuperar", async (req, res) => {
   const { email } = req.body
   
   try{
  const user = await User.findOne({email : email })
   if (!user) {
      return res.status(404).json({ msg: 'Usuário não cadastrado!'})
   };
  

   const transporter = nodemailer.createTransport({
      host: "smtp.mailtrap.io",
   port: 2525,
   auth: {
      user: "5b7191815f86b2",
      pass: "e36e80649eca26",
       }
   });
   const newPassword = crypto.randomBytes(4).toString('HEX')
   
   transporter.sendMail({
      from: 'admnistrador <985fe0ba66-7711ce+1@inbox.mailtrap.io>',
      to: email,
      subject: "RECUPERAÇÃO DE SENHA!",
      text: `Olá, seua nova senha para acessar o sistema é: ${newPassword}`
      
   }).then(  
        () => {
      bcrypt.hash(newPassword, 8).then(
          
         
          User.findByIdAndUpdate(user.id,{
             '$set':{
               senha: newPassword
               
             }
         }) 
         
            .then(
               () => {

                  response.status(200).json ({msg: 'Email enviado'})
              }
            
            ).catch(
               () => {
                  response.status(404).json({ msg: 'user not found' })
                              
                      }
                  )   
            )
         }
      
            ).catch (
               () => {
                  return response.status(404).json({ message: 'Fail to send email '})      
               }
             )
         } catch (error){
            return response.status(404).json({message: 'user not found'})

         }
      });


