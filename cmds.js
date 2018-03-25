
const Sequelize = require('sequelize');
//Importación del modelo.
const {models} = require('./model');
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

models.quiz.findAll()
.each(quiz => {
    log(  `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
})
.catch(error => {
  errorlog(error.message);
})
.then(()=> {
  rl.prompt();
});

};

/*Esta función devuelve una promesa que:
* - Valida que se ha introducido un valor para el argumento.
* - Convierte el parámetro en un número entero.
* Si todo va bien, la promesa se satisface y devuelve el valor del id a validar.
*
* @param id Parámetro con el índice a validar.
*/

const validateId = id => {

  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined"){
      reject(new Error(` Falta el parámetro <id>. `));
    } else {
      id = parseInt(id); //coger la parte entera y descartar lo demás.
      if (Number.isNaN(id)){
        reject(new Error(` El valor del parámetro <id> no es un número. `));
      } else {
        resolve(id);
      }
    }
  });
};

//Muestra el quizz indicado en el parámetro: la pregunta y la respuesta.
//@param id Clave del quiz a mostrar.
exports.showCmd = (rl, id) => {
  validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
      if(!quiz) {
        throw new Error(`No existe un quiz asociado al id = ${id}. `);
      }
        log(  `[${colorize(quiz.id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

    })
    .catch(error => {
       errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
};

/*Esta función convierte la llamada rl.question, que está basada en callback,
*en una basada en promesas.
*
*Esta función devuelve una promesa que cuando se cumple, proporciona el texto
*introducido. Entonces la llamada a .then que hay que hacer la promesa devuelta sera:
*    .then(answer => {...})
*
*También colorea en rojo el texto de la pregunta, elimina espacios al principio y f
*
*@param rl Objeto readline usado para implementar el CLI.
*@param text Pregunta que hay que hacerle al usuario.
*/

const makeQuestion = (rl, text) => {

      return new Sequelize.Promise ((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
          resolve(answer.trim());
        });
      });
};


/*Añade un nuevo quiz al modelo.
*Pregunta interactivamente por la pregunta y por la respuesta.
*El prompt hay que sacarlo cuando ya se ha terminado la interacción con el usuario,
*es decir, la llamdada a rl.prompt() se debe hacer en la callback de la segunda
*llamada a rl.question.
*@param  rl  objeto readline usado para implementar el CLI.
*/

exports.addCmd = rl => {
  makeQuestion(rl,' Introduzca una pregunta: ' )
  .then(q => {
    return makeQuestion(rl,' Introduzca la respuesta: ' )
    .then(a => {
      return {question: q, answer: a};
    });
  })
  .then (quiz => {
    return models.quiz.create(quiz);
  })
  .then ((quiz) => {
    log(`  ${colorize('Se ha añadido', 'magenta')} : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer} `);
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
}


/*Borra un quiz del modelo.
*
*@param rl Objeto readline usado para implementar el CLI.
*@param id Clave del quiz a borrar en el modelo.
*/
exports.deleteCmd = (rl,id)  => {
  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
      errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
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
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
        throw new Error(`No existe un quiz asociado al id =${id}. `);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
      .then(q => {
        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
        return makeQuestion(rl, ' Introduzca la respuesta: ')
          .then(a => {
              quiz.question = q;
              quiz.answer = a;
              return quiz;
          });
      });
    })

    .then(quiz => {
      return quiz.save();
    })

    .then (quiz => {
      log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', "magenta")} ${quiz.answer}` )
    })

    .catch(Sequelize.ValidationError, error => {
      errorlog('El quiz es erroneo: ');
      error.errors.forEach(({message}) => errorlog(message));
    })

    .catch(error => {
      errorlog(error.message);
    })

    .then(() => {
      rl.prompt();
    })

  };

/*Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
*@param  rl  objeto readline usado para implementar el CLI.
*@param  id  clave del quiz que se va a preguntar del modelo.
*/

exports.testCmd = (rl,id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz){
        throw new Error(`No existe un quiz asociado al id =${id}. `);
    }

      return makeQuestion(rl,` ${quiz.question}${"? "}`)
      .then(a => {

          if(a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
          log('Su respuesta es correcta.');
          biglog("CORRECTA","green");
          }
          else{
          log('Su respuesta es incorrecta.');
          biglog("INCORRECTA","RED");
          }
      });
    })

    .catch(Sequelize.ValidationError, error => {
      errorlog('El quiz es erroneo: ');
      error.errors.forEach(({message}) => errorlog(message));
    })

    .catch(error => {
      errorlog(error.message);
    })

    .then(() => {
      rl.prompt();
    });

};


//Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
/*exports.testCmd = (rl,id)  => {
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
*/
//Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
//Se gana si se contesta a todos satisfactoriamente.
/*exports.playCmd = rl => {

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

*/
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
