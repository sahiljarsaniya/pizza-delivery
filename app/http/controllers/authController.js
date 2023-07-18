const User = require('../../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport');


function authController() {

    const _getRedirectUrl = (req) =>{
        return req.user.role === 'admin' ? '/admin/orders' : '/customer/orders'
    }

    return {
        login(req, res) {
            res.render('auth/login')
        },
        postLogin(req, res, next) {

            const { email, password } = req.body
            //validate request
            if ( !email || !password) {
                req.flash('error', 'All fields are required')
                return res.redirect('/login')
            }

            passport.authenticate('local', (err, user, info)=>{
                if(err){
                    req.flash('error', info.message)
                    return next(err)
                }
                if(!user){
                    req.flash('error', info.message)
                    return res.redirect('/login')
                }
                req.logIn(user, (err)=>{
                    if(err){
                        req.flash('error', info.message)
                        return next(err)
                    }

                    return res.redirect(_getRedirectUrl(req))
                })
            })(req,res,next)
        },
        register(req, res) {
            res.render('auth/register')
        },
        async postRegister(req, res) {
            const { name, email, password } = req.body

            //validate request
            if (!name || !email || !password) {
                req.flash('error', 'All fields are required')
                req.flash('name', name)
                req.flash('email', email)

                return res.redirect('/register')
            }

            //check if email exist
            // User.exists({ email: email }, (err, result) => {
            //     if (result) {
            //         req.flash('error', 'Email already taken')
            //         req.flash('name', name)
            //         req.flash('email', email)
            //         return res.redirect('/register')
            //     }
            // })

            const userExists = await User.exists({ email: email })
            if (userExists) {
                req.flash('error', 'Email already taken')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/register')
            }


            //hash password

            const hashedPassword = await bcrypt.hash(password, 10)

            //create user

            const user = new User({
                name: name,
                email: email,
                password: hashedPassword
            })

            user.save().then((user) => {
                //login
                return res.redirect('/')
            }).catch(err => {
                req.flash('error', 'something went wrong')
                return res.redirect('/register')
            })
        },
        logout(req, res){
            req.logout(function(err) {
                if (err) {
                  // Handle any potential errors
                  // For example, you can log the error or send an error response to the client
                  console.error(err);
                  return res.status(500).send('Internal Server Error');
                }
                
                // Perform any additional logic after logout
                
                // Redirect the user to a specific page
                res.redirect('/login');
              });
              
        }
    }
}

module.exports = authController