

//Importación del modelo.
const model = require('./model');
//Importación de las funciones de salida.
const {log, biglog, errorlog, colorize} = require("./out");

//Muestra la ayuda
//@param rl Objeto readline usado para implementar el CLI.
exports.helpCmd = rl => {

  log("Comandos:");
  log("  h|help - Muestra esta ayuda.");
  log("  list - Listar los quizzes existentes.");
  log("  show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
  log("  add - Añadir un nuevo quizz interactivamente.");
  log("  delete <id> - Borrar el quiz indicado.");
  log("  edit <id> - Editar el quiz indicado.");
  log("  test <id> - Probar el quiz indicado.");
  log("  p|play <id> - Jugar a preguntar aleatoriamente todos los quizzes.");
  log("  credits - Créditos.");
  log("  q|quit - Salir del programa.");
  rl.prompt()
};

//Lista todos los quizzes existentes en el modelo
exports.listCmd = rl => {

  model.getAll().forEach((quiz, id) => {

    log(   `[${colorize(id, 'magenta')}]: ${quiz.question}`);

  });

  rl.prompt()
};

//Muestra el quizz indicado en el parámetro: la pregunta y la respuesta.
//@param id Clave del quiz a mostrar.
exports.showCmd = (rl, id) => {

  if(typeof id === "undefined"){
    errorlog(`Falta el parámetro id. `);
  }else {
    try{
      const quiz = model.getByIndex(id);
      log(` [${colorize(id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer} `);
    }catch(error) {
        errorlog(error.message);
    }
  }
  rl.prompt()
};


/*Añade un nuevo quiz al modelo.
*Pregunta interactivamente por la pregunta y por la respuesta.
*El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
*es decir, la llamdada a rl.prompt() se debe hacer en la callback de la segunda
*llamada a rl.question.
*@param  rl  objeto readline usado para implementar el CLI.
*/

exports.addCmd = rl => {
rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
  rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {
      model.add(question, answer);
      log(`  ${colorize('Se ha añadido', 'magenta')} : ${question} ${colorize('=>', 'magenta')} ${answer} `);
      rl.prompt();
    });
  });
};

/*Borra un quiz del modelo.
*
*@param rl Objeto readline usado para implementar el CLI.
*@param id Clave del quiz a borrar en el modelo.
*/
exports.deleteCmd = (rl,id)  => {

    if(typeof id === "undefined"){
      errorlog(`Falta el parámetro id. `);
    }else {
      try{
        model.deleteByIndex(id);
      }catch(error) {
          errorlog(error.message);
      }
    }

  rl.prompt()

};

/*Edita un quiz del modelo.
*Pregunta interactivamente por la pregunta y por la respuesta.
*El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
*es decir, la llamdada a rl.prompt() se debe hacer en la callback de la segunda
*llamada a rl.question.
*@param  rl  objeto readline usado para implementar el CLI.
*@param  id  clave del quiz a editar en el modelo.
*/
exports.editCmd = (rl,id)  => {
  if(typeof id === "undefined") {
      errorlog(`Falta el parámetro id.`);
      rl.prompt();
  }else {
     try {
       const quiz = model.getByIndex(id);
       process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
       rl.question(colorize('Introduzca una pregunta: ', 'red'), question => {
         process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
         rl.question(colorize('Introduzca una respuesta: ', 'red'), answer => {
           model.update(id, question, answer);
           log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', "magenta")} ${answer}` )
           rl.prompt();
         });
      });
    }catch(error){
      errorlog(error.message);
      rl.prompt();
    };
  };

};

//Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
exports.testCmd = (rl,id)  => {
  if(typeof id === "undefined") {
      errorlog(`Falta el parámetro id.`);
      rl.prompt();
    } else {
        try{
            const quiz = model.getByIndex(id);
            rl.question(colorize(` ${quiz.question}${"? "}`, 'red'), respuestaUsuario => {
              if ((respuestaUsuario.toLowerCase().trim()) === quiz.answer.toLowerCase()) {
                console.log("Su respuesta es correcta.");
                biglog("Correcta","green");
                }
                else {
                  console.log("Su respuesta es incorrecta.");
                  biglog("Incorrecta","red");
                }

                rl.prompt();

              });


          } catch(error){
                  errorlog(error.message);
                  rl.prompt();
              };
            };
          };

//Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
//Se gana si se contesta a todos satisfactoriamente.
exports.playCmd = rl => {

  let score = 0; //Variable que lleva un registro de la puntuación del test.
  let toBeResolved = [];
  let numeroPreguntas = model.count();

  for(var i = 0; i< numeroPreguntas; i++){
      toBeResolved.push(i);
    }

    const playOne = () => {

          if(toBeResolved.length === 0) {

                console.log("No hay nada más que preguntar.");
                console.log(`Fin del juego. Aciertos: ${score}`);
                biglog(score, "magenta");
                rl.prompt();
          }
          else{
                let a = Math.random();
                let b = toBeResolved.length-1;
                let c= a*b;
                let randomId = Math.round(c);

                  const quiz = model.getByIndex(toBeResolved[randomId]);

                  toBeResolved.splice(randomId,1);



                  rl.question(colorize(` ${quiz.question} ${"? "}`, 'red'), respuestaUsuario => {
                    if ((respuestaUsuario.toLowerCase().trim()) === quiz.answer.toLowerCase()) {

                      score ++;
                      console.log(`${"CORRECTO. Lleva"} ${score} ${"aciertos."}`);
                      playOne();

                    }


                      else {
                      console.log("INCORRECTO.");
                      console.log(`Fin del juego. Aciertos: ${score}`);
                      biglog(score, "magenta");

                      }

                      rl.prompt();
                });
            };

       };

       playOne();
};


//Muestra los nombres de los autores de la práctica.
exports.creditsCmd = rl => {

  log('Autor de la practica:');
  log('Alvaro Cuadrado Rodriguez', 'green');
  rl.prompt()
};

//Terminar el programa.

exports.quitCmd = rl => {

  rl.close();

};
