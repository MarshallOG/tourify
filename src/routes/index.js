const { Router } = require('express');
const router = Router();
const db = require('../services/database');  
const bcrypt = require('bcrypt');
const path = require('path');
const passport = require('passport'); //PASSPORT



const multer = require('multer');  //AGREGADO

const storageProfile = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'static/usersimages'); // Ruta donde se guardarán las imágenes de perfil
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
const uploadProfile = multer({ storage: storageProfile });

const storageHistoricals = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'static/imageshistoricals'); // Ruta donde se guardarán las imágenes de historicals
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
const uploadHistorical = multer({ storage: storageHistoricals });

const storageRestaurants = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'static/imagesrestaurants'); // Ruta donde se guardarán las imágenes de restaurants
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
const uploadRestaurant = multer({ storage: storageRestaurants });

const storageEvents = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'static/imagesevents'); // Ruta donde se guardarán las imágenes de events
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname);
  }
});
const uploadEvent = multer({ storage: storageEvents });

const { promisify }= require('util'); //AGREGADO
const { log } = require('console');
const { text } = require('body-parser');
const { Select } = require('flowbite-react');
db.query = promisify(db.query); //AGREGADO

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};//No se si va el punto y coma segun yo si




    //COMIENZAN RUTAS DE LAS PAGINAS DEL INTEGRADOR



        //TODO DEL LOGIN (GET Y POST) y logout


router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error al destruir la sesión:', err);
    } else {
      // Después de destruir la sesión, simplemente redirige al usuario

      res.redirect('/');
    }
  });
});


router.get('/', (req, res) => {     //Funcion para renderizar la primera pagina de Tourify para que el usuario se logee (get)
  try {
    res.render('login.ejs');
  } catch (error) {
      throw error;
  }
});


router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      // Error del servidor
      return res.render('login', { errorServidor: true });
    }
    if (!user) {
      // Email o contraseña incorrectos
      return res.render('login', { errorEmail: true });
    }
    req.logIn(user, (err) => {
      if (err) {
        // Error del servidor al iniciar sesión
        return res.render('login', { errorServidor: true });
      }
      // Login exitoso
      return res.redirect('/homeu');
    });
  })(req, res, next);
});

  //AQUI TERMINA TODO LO DEL LOGIN



          //TODO DEL REGISTER (GET Y POST)


router.get('/register', (req, res) => {   //Funcion que renderiza la pagina de register (get)
    res.render('register.ejs');
});

router.post('/register', (req, res) => {
  const name = req.body.name;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const email = req.body.email;

  // Inicializar variables de estado
  let contraseñaNoCoincide = false;
  let errorInterno = false;

  // Verificar si las contraseñas coinciden
  const passwordsMatch = (password === confirmPassword);

  if (!passwordsMatch) {
    contraseñaNoCoincide = true;
    console.log('Las contraseñas no coinciden');
    return res.render('register', { contraseñaNoCoincide });
  }

  // Intentar insertar un nuevo usuario
  const registerSQL = 'INSERT INTO users (name, password, email, image, country, active, role) VALUES (?, SHA(?), ?, "user.png", 42, 1, 1)';
  const valores = [name, password, email];
  db.query(registerSQL, valores, (error, resultado) => {
    if (error) {
      errorInterno = true;
      console.log('Error al insertar usuario: ' + error.message);
      return res.render('register', { errorInterno });
    }

    // Autenticar al usuario después del registro
    passport.authenticate('local')(req, res, () => {
      res.redirect('/homeu');  // Redirigir al usuario a la página de inicio después del registro
    });
  });
});





  //AQUI TERMINA TODO LO DEL REGISTER



          //TODO DEL HOMEU (GET)

router.get('/homeu', ensureAuthenticated, async (req, res) => {
            try {
              const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
              res.render('index.ejs', { img: img });

            } catch (error) {
              throw error;
            }
});
 

  //AQUI TERMINA TODO LO DEL HOMEU



          //TODO DE lo del mapa (GET Y POST)


  router.get('/map', ensureAuthenticated, async(req, res) => {     //Renderiza pagina del mapa con las marcas correspondientes (get)
    
    try {
      const events = await db.query('select * from events');
      const restaurants = await db.query('select id_food, name, coordinate, description, image FROM restaurants');
      const historicalplaces = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 1');
      const museums = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 2'); 
      const monuments = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 3');
      const theaters = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 4');
      const towns = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 5');

      const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);

      res.render('map.ejs', {img: img, events: events, restaurants: restaurants,historicalplaces:historicalplaces, museums: museums, monuments:monuments, theaters: theaters, towns:towns})
          
    } catch (error) {
      throw error;
    }
  });

  router.get('/map/:id_event', ensureAuthenticated, async(req, res) => {     //Renderiza pagina del mapa con las marcas correspondientes (get)
    
    try {
      const events = await db.query('select * from events');
      const restaurants = await db.query('select id_food, name, coordinate, description, image FROM restaurants');
      const historicalplaces = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 1');
      const museums = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 2'); 
      const monuments = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 3');
      const theaters = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 4');
      const towns = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 5');

      const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);

      res.render('map.ejs', {img: img, events: events, restaurants: restaurants,historicalplaces:historicalplaces, museums: museums, monuments:monuments, theaters: theaters, towns:towns})
          
    } catch (error) {
      throw error;
    }
  });
  

  router.get('/historicals/:id_historical', ensureAuthenticated, async(req, res) => {
    try {
     
      const models = await db.query('SELECT id_historical, model FROM models WHERE id_historical = ?',[req.params.id_historical]);
      const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
      const historical = await db.query('SELECT * FROM gethistorical WHERE id_historical = ?',[req.params.id_historical]);
      const achievement = await db.query('SELECT id_user FROM users_achievements WHERE id_historical = ?',[req.params.id_historical]);

      res.render('historicals.ejs', {img: img, historical: historical, models: models, achievement: achievement});

    } catch (error) {
        throw error;
    }
  });

  router.get('/model/:id_historical', async(req, res) => {

    try {
      const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
      const models = await db.query('SELECT model FROM models WHERE id_historical = ?',[req.params.id_historical]);
      res.render('model.ejs', {img: img, models: models})

    } catch (error) {
        throw error;
    }

  });

  router.post('/getachievement', async(req, res) => {

    try {
      const achievementHistorical = req.body.id_historical;

      await db.query('INSERT INTO users_achievements (id_user, id_historical, active) VALUES (?, ?, 1)', [req.user.id_user, achievementHistorical]);

      const models = await db.query('SELECT id_historical, model FROM models WHERE id_historical = ?',[achievementHistorical]);
      const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
      const historical = await db.query('SELECT * FROM gethistorical WHERE id_historical = ?',[achievementHistorical]);
      const achievement = await db.query('SELECT id_user FROM users_achievements WHERE id_historical = ?',[achievementHistorical]);

      res.render('historicals.ejs', {img: img, historical: historical, models: models, achievement: achievement});

    } catch (error) {
        throw error;
    }

  });


 //AQUI TERMINA TODO LO DEL MAPA



          //TODO DE LOS EVENTS (GET) 

  router.get('/events', ensureAuthenticated, async(req, res) => {
    try {
        const events = await db.query('select * from events');  //Obtener eventos
        const fechasLegibles = events.map(event => {
        const fecha = new Date(event.dateend).toLocaleString();
            return fecha;
        });
        const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
        res.render('events.ejs', {events: events, img: img, fechasLegibles: fechasLegibles});  //Renderizar la pagina con los datos
    } catch (error) {
        throw error;
    }
  });          

//AQUI TERMINA TODO LO DE EVENTS



          //TODO LO DE ACHIEVEMENTS (GET) 

router.get('/achievements', ensureAuthenticated, async (req,res) => {
  try {
    const achievements = await db.query('select id_historical, name, image from historicals WHERE id_historical NOT IN (select id_historical from users_achievements WHERE id_user = ?)', [req.user.id_user]);
    const status = await db.query('select id_historical, name, image, DATE_FORMAT(created_at, "%Y-%m-%d %H:%i:%s") AS created_at from historicals WHERE id_historical IN (select id_historical from users_achievements WHERE id_user = ?)', [req.user.id_user]);
    const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
    res.render('achievements.ejs', {achievements: achievements, img: img, status: status});
  } catch (error) {
      throw error;
      
  }
});

//AQUI TERMINA TODO LO DE LOS ACHIEVEMENTS



          //TODO LO DE PROFILE (GET) 

  router.get('/profile', ensureAuthenticated, async(req, res) => {
    try {

        const user8 = await db.query('SELECT name, email, (SELECT name FROM countries WHERE id_country = (SELECT country FROM users WHERE id_user = ?)) as country FROM users where id_user = ?', [req.user.id_user, req.user.id_user]);

        const logros = await db.query('CALL getLogros(?, @logros)', [req.user.id_user]);
        const resultado = await db.query('SELECT @logros as logros');
        console.log(resultado);
        
        const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
        console.log(img);

        res.render('profile.ejs',{user: user8, img: img, resultado:resultado})
    } catch (error) {
        throw error;
    }
  });

 //AQUI TERMINA TODO LO DE PROFILE
 
 

          //TODO LO DE EDITPROFILE (GET Y POST) 

  router.get('/editprofile', ensureAuthenticated, async (req, res) => {
    try {
      const user8 = await db.query('SELECT name, email, (SELECT name FROM countries WHERE id_country = (SELECT country FROM users WHERE id_user = ?)) as country, password FROM users where id_user = ?', [req.user.id_user, req.user.id_user]);
      const countriesList = await db.query('SELECT id_country, name FROM countries'); // Obtener la lista de países
      countriesList.sort((a, b) => a.name.localeCompare(b.name));   //Acomoda los paises en orden alfabetico

      const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);
    
      res.render('editprofile.ejs', {
        user: user8,                  //Pasa todos los valores de la query del usuario en este caso igual a 8
        countriesList: countriesList, // Pasar la lista de países a la vista
        img:img //Pasar imagen del usuario
      });
    } catch (error) {
      throw error;
    }
  });

  router.post('/editprofile',uploadProfile.single('profileImage'), async (req, res) => {       //Esta parte nomas se alargo por culpa del bug de seleccionar el pais, fue dificil, pero se logró. :´)
      
    try {

      if (!req.body.password) {
        
        if (!req.file) {
        
          if (isNaN(parseInt(req.body.country, 10))) {
          
            const { name, email } = req.body;
            const newUser = {
                name,
                email
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ? where id_user = ?', [newUser.name, newUser.email, req.user.id_user]);
            res.redirect('/profile');
    
          } else {
            const { name, email, country } = req.body;
            const newUser = {
                name,
                email,
                country
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, country = ? where id_user = ?', [newUser.name, newUser.email, newUser.country, req.user.id_user]);
            res.redirect('/profile');
    
          }
  
        } else {
  
          const newImagenUser = req.file.originalname;
          
          if (isNaN(parseInt(req.body.country, 10))) {
          
            const { name, email } = req.body;
            const newUser = {
                name,
                email
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, image = ? where id_user = ?', [newUser.name, newUser.email, newImagenUser, req.user.id_user]);
            res.redirect('/profile');
    
          } else {
            const { name, email, country, } = req.body;
            const newUser = {
                name,
                email,
                country
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, country = ?, image = ? where id_user = ?', [newUser.name, newUser.email, newUser.country, newImagenUser, req.user.id_user]);
            res.redirect('/profile');
    
          }
  
        }  


      } else {
        
        if (!req.file) {
        
          if (isNaN(parseInt(req.body.country, 10))) {
          
            const { name, email, password } = req.body;
            const newUser = {
                name,
                email,
                password
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, password = SHA(?) where id_user = ?', [newUser.name, newUser.email, newUser.password, req.user.id_user]);
            res.redirect('/profile');
    
          } else {
            const { name, email, country, password } = req.body;
            const newUser = {
                name,
                email,
                country,
                password
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, country = ?, password = SHA(?) where id_user = ?', [newUser.name, newUser.email, newUser.country, newUser.password, req.user.id_user]);
            res.redirect('/profile');
    
          }
  
        } else {
  
          const newImagenUser = req.file.originalname;
          
          if (isNaN(parseInt(req.body.country, 10))) {
          
            const { name, email, password } = req.body;
            const newUser = {
                name,
                email,
                password
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, password = SHA(?), image = ? where id_user = ?', [newUser.name, newUser.email, newUser.password, newImagenUser, req.user.id_user]);
            res.redirect('/profile');
    
          } else {
            const { name, email, country, password } = req.body;
            const newUser = {
                name,
                email,
                country,
                password
            };
            console.log(newUser);
            await db.query('UPDATE users SET name = ?, email = ?, country = ?, password = SHA(?), image = ? where id_user = ?', [newUser.name, newUser.email, newUser.country, newUser.password, newImagenUser, req.user.id_user]);
            res.redirect('/profile');
    
          }
  
        }  

      }


    } catch (error) {
        throw error;
    }
    
  });

   //AQUI TERMINA TODO LO DE EDITPROFILE



          //TODO LO DEL ADMIN (GET Y POST) 

router.get('/admin', ensureAuthenticated, async(req, res) => {
  
    
  try {
    const events = await db.query('select * from events');
    const restaurants = await db.query('select id_food, name, coordinate, description, image FROM restaurants');
    const historicalplaces = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 1');
    const museums = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 2'); 
    const monuments = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 3');
    const theaters = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 4');
    const towns = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 5');

    const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);

    res.render('admin.ejs', {img: img, events: events, restaurants: restaurants,historicalplaces:historicalplaces, museums: museums, monuments:monuments, theaters: theaters, towns:towns})
        
  } catch (error) {
      throw error;
  }
});

// Ruta para manejar la carga de archivos

router.post('/addhistorical', (req, res) => {

});

router.post('/addevent', (req, res) => {

});

router.post('/addrestaurant',uploadRestaurant.single('imagerestaurant'), (req, res) => {

  try {
    
    const { namerestaurant, coordenatesrestaurant, descriptionrestaurant } = req.body;
      const newRestaurant = {
        namerestaurant,
        coordenatesrestaurant,
        descriptionrestaurant
    };

    const newImageRestaurant = req.file.originalname;

    console.log(newRestaurant);
    console.log(newImageRestaurant);
    
    res.redirect('/admin');
    
  } catch (error) {
      throw error;
  }
});

router.post('/uploadhistorical',uploadHistorical.single('imagerestaurant'), (req, res) => {

});

router.post('/uploadevent',uploadEvent.single('imagerestaurant'), (req, res) => {

});

router.post('/uploadrestaurant', (req, res) => {

});

router.post('/deletehistorical', (req, res) => {

});

router.post('/deleteevent', (req, res) => {

});

router.post('/deleterestaurant', (req, res) => {

  console.log("Deleted");

});
  
  

   //AQUI TERMINA TODO LO DEL ADMIN


  //PRUEBAS CON OTRAS PAGINAS QUE NO PERTENECERAN AL INTEGRADOR


//MAPA DE CHUY

router.get('/mapchuy', ensureAuthenticated, (req, res) => {
  res.render('mapchuy.ejs');
});

//MAPA DE PRUEBA

router.get('/mapprueba', ensureAuthenticated, (req, res) => {
  res.render('mapprueba.ejs');
});

router.get('/admincopy', ensureAuthenticated, async(req, res) => {
  
    
  try {
    const events = await db.query('select * from events');
    const restaurants = await db.query('select id_food, name, coordinate, description, image FROM restaurants');
    const historicalplaces = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 1');
    const museums = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 2'); 
    const monuments = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 3');
    const theaters = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 4');
    const towns = await db.query('select id_historical, name, coordinate, pintype, image from historicals where pintype = 5');

    const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);

    res.render('admincopy.ejs', {img: img, events: events, restaurants: restaurants,historicalplaces:historicalplaces, museums: museums, monuments:monuments, theaters: theaters, towns:towns})
        
  } catch (error) {
    throw error;
  }
});



//TERMINA COSAS DE MAPAS

//MODELO 3D


router.get('/model2', ensureAuthenticated, (req, res) => {
  res.render('model2.ejs');
});

router.get('/model4', ensureAuthenticated, (req, res) => {
  res.render('model4.ejs');
});

  router.get('/support', ensureAuthenticated, async(req, res) => {
    const img = await db.query('SELECT name, image, role FROM users WHERE id_user = ?', [req.user.id_user]);

    res.render('support.ejs', {img: img});
  });
//EL HISTORICAL DE PRUEBA QUE TIENE LA CATEDRAL



module.exports = router;   //LA COSA QUE EXPORTA A APP.JS