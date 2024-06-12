import express from "express";
import {dirname} from "path";
import {fileURLToPath} from "url";
import MarkdownIt from "markdown-it";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import {convert} from "html-to-text";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';
import env from "dotenv";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url)); 

const app = express();

env.config();
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

const startTime = new Date();
const webVersion = 1.0;

var md = new MarkdownIt({html: true}); // configure to be able to render html tags

app.use(express.static("public")); // set the path of static resources
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

await mongoose.connect("mongodb+srv://admin-Bruce:" + process.env.ATLAS_PASSWORD + "@cluster0.lpt8u6w.mongodb.net/personal-website");

const articleSche = new mongoose.Schema({
    author: String,
    title: String,
    tag: [String],
    text: String,
    date: Date,
    editDate: [Date],
    hits: Number,
    recommend: Boolean
});
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const serverStartSchema = new mongoose.Schema({
    startTime: Date,
    webVersion: Number
});

userSchema.plugin(passportLocalMongoose);

const Article = mongoose.model("Article", articleSche);
const User = mongoose.model("User", userSchema);
const ServerStart = mongoose.model("serverStart", serverStartSchema);

// Record the time when the server starts
const serverStart = new ServerStart({
    startTime: startTime,
    webVersion: webVersion
});
serverStart.save();

const serverCollection = await ServerStart.find({});
const originalStartTime = serverCollection[0].startTime; // Get the first start time from the ServerStart collection

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Main page
app.get("/", async (req, res) => {
    const recArticles = await findRecommends();
    recArticles.map(function(article) {
        // Parse the markdown to the HTML text
        article.text = md.render(article.text);
        // Extract the text from HTML(because by default, heading tags are uppercased, we need to set it to false manually)
        var pureText = convert(article.text, { selectors: [
            {selector: 'h1', options: { uppercase: false }},
            {selector: 'h2', options: { uppercase: false }},
            {selector: 'h3', options: { uppercase: false }},
            {selector: 'h4', options: { uppercase: false }},
            {selector: 'h5', options: { uppercase: false }},
            {selector: 'h6', options: { uppercase: false }}
          ]});
        // Delete the Enter keys
        article.info = pureText.replace(/(\r\n|\n|\r)/gm, "").substring(0, 200);
    });
    res.render(__dirname + "/views/index.ejs", {articles: recArticles, startTime: originalStartTime});
});

// Allow to register new user if you have logged in
app.get("/register", function(req, res){
    if (req.isAuthenticated()){
        res.render(__dirname + "/views/register.ejs", {startTime: originalStartTime});
    } else {
        res.redirect("/login");
    }
});

app.post("/register", function(req, res) {
    if (req.isAuthenticated()){
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                res.render(__dirname + "/views/success.ejs", {pageName: "Log in", route: "manage/write", startTime: originalStartTime});
            }
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.render(__dirname + "/views/login.ejs", {startTime: originalStartTime});
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local", { failureRedirect: '/login' })(req, res, function(){
                res.redirect("/manage");
            });
        }
    });
});

app.get("/manage", (req, res) => {
    if (req.isAuthenticated()){
        res.render(__dirname + "/views/write.ejs");
    } else {
        res.redirect("/login");
    }
});

app.get("/success", (req, res) => {
    if (!req.query.route) {
        res.redirect("/");
    } else {
        res.render("success.ejs", {route: req.query.route, startTime: originalStartTime});
    }
});

app.get("/blog", async (req, res) => {
    var articles = await findAllArticles();
    const pageNum = Math.ceil(articles.length / 12);
    articles = articles.slice(0, 12);
    articles.map(function(article) {
        // Parse the markdown to the HTML text
        article.text = md.render(article.text);
        // Extract the text from HTML(because by default, heading tags are uppercased, we need to set it to false manually)
        var pureText = convert(article.text, { selectors: [
            {selector: 'h1', options: { uppercase: false }},
            {selector: 'h2', options: { uppercase: false }},
            {selector: 'h3', options: { uppercase: false }},
            {selector: 'h4', options: { uppercase: false }},
            {selector: 'h5', options: { uppercase: false }},
            {selector: 'h6', options: { uppercase: false }}
          ]});
        // Delete the Enter keys
        article.info = pureText.replace(/(\r\n|\n|\r)/gm, "").substring(0, 200);
    });
    res.render(__dirname + "/views/articleList.ejs", {articles: articles, pageNum: pageNum, currPageNum: 1, startTime: originalStartTime});
});

// Pagination
app.get("/blog/page/:pageId", async (req, res) => {
    var currPageNum = Number(req.params.pageId);
    var articles = await findAllArticles();
    const pageNum = Math.ceil(articles.length / 12);
    articles = articles.slice(12 * (currPageNum - 1), 12 * currPageNum);
    articles.map(function(article) {
        // Parse the markdown to the HTML text
        article.text = md.render(article.text);
        // Extract the text from HTML
        var pureText = convert(article.text, { selectors: [
            {selector: 'h1', options: { uppercase: false }},
            {selector: 'h2', options: { uppercase: false }},
            {selector: 'h3', options: { uppercase: false }},
            {selector: 'h4', options: { uppercase: false }},
            {selector: 'h5', options: { uppercase: false }},
            {selector: 'h6', options: { uppercase: false }}
          ]});
        // Delete the Enter keys
        article.info = pureText.replace(/(\r\n|\n|\r)/gm, "").substring(0, 200);
    });
    res.render(__dirname + "/views/articleList.ejs", {articles: articles, pageNum: pageNum, currPageNum: currPageNum, startTime: originalStartTime});
});

// Detail of the blog
app.get("/blog/:article_id", async (req, res) => {
    const filter = {_id: req.params.article_id};
    const oldOne = await Article.findOne(filter);
    // Increase the hits by 1
    const update = {hits: oldOne.hits + 1};
    const newOne = await Article.findOneAndUpdate(filter, update, {new: true});
    // Parse the markdown to the HTML text
    newOne.text = md.render(newOne.text);
    res.render(__dirname + "/views/article.ejs", {article: newOne, startTime: originalStartTime});
});

app.get("/about", (req, res) => {
    res.render(__dirname + "/views/about.ejs", {startTime: originalStartTime});
});

app.get("/manage/write", (req, res) => {
    if (req.isAuthenticated()){
        res.render(__dirname + "/views/write.ejs");
    } else {
        res.redirect("/login");
    }
});

app.get("/manage/editList", async (req, res) => {
    if (req.isAuthenticated()){
        var articles = await findAllArticles();
        const pageNum = Math.ceil(articles.length / 12);
        articles = articles.slice(0, 12);
        res.render(__dirname + "/views/editList.ejs", {articles: articles, pageNum: pageNum, currPageNum: 1});
    } else {
        res.redirect("/login");
    }
})

app.get("/manage/editList/delete/:articleId", async (req, res) => {
    if (req.isAuthenticated()){
        var article = await Article.findOne({_id: req.params.articleId});
        const dir = 'public/uploadedImages/' + article.author + '/' + article.title + '/';
        fs.rmSync(dir, {recursive: true, force: true});
        await Article.deleteOne({_id: req.params.articleId});
        res.redirect("/manage/editList");
    } else {
        res.redirect("/login");
    }
});

app.get("/manage/editList/page/:pageId", async (req, res) => {
    if (req.isAuthenticated()){
        var currPageNum = Number(req.params.pageId);
        var articles = await findAllArticles();
        const pageNum = Math.ceil(articles.length / 12);
        articles = articles.slice(12 * (currPageNum - 1), 12 * currPageNum);
        res.render(__dirname + "/views/editList.ejs", {articles: articles, pageNum: pageNum, currPageNum: currPageNum});
    } else {
        res.redirect("/login");
    }
});


// Change the recommendation
app.post("/manage/editList/form/recommend/:articleId", async (req, res) => {
    if (req.isAuthenticated()){
        var recommend = true;
        if (req.body.recommend === undefined) {
            recommend = false;
        }
        await Article.updateOne({_id: req.params.articleId}, {recommend: recommend});
        res.redirect("/manage/editList");
    } else {
        res.redirect("/login");
    }
});

// Lead to page for editing the article
app.get("/manage/editList/edit", async (req, res) => {
    var article = await Article.findOne({_id: req.query.articleId});
    res.render(__dirname + "/views/edit.ejs", {article: article});
});

app.listen(port, () => {
    console.log("Server running on port " + port);
});


async function findAllArticles() {
    const all= await Article.find({});
    return all;
}

async function findRecommends() {
    const all= await Article.find({recommend: true});
    return all;
}
