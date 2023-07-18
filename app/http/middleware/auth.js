function auth(req, res ,next){
    if(req.isAuthenticated()){
        return next()
    }
    return redirect('/login')
}

module.exports = auth