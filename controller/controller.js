//The homework is strongly inspired by activity 20 from week 18. 
//These github repositories have also helped me:
//https://github.com/Dcoxmen/scraper_news
//https://github.com/CavanWagg/mongoose-news-scraper
//https://github.com/tomtom28/mongodb-web-scraper

//Let's require the packages that we need for our controller to run
var express = require("express");
var router = express.Router();
var path = require("path");
var request = require("request");
var cheerio = require("cheerio");

//These belong to the models folder
var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.redirect("/articles");
});

//This block of code powers the main functionnality of the app which is scraping news from eurosport.com

router.get("/getnews", function(req, res) {
  request("https://www.eurosport.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    var titlesArray = [];

    $("div").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      
      //Adding eurosport.com url in front of every article link to be able to serve each article
      //with handlebars. 
      
        result.link = "https://www.eurosport.com" + $(this)
        .children("a")
        .attr("href");


      if (result.title !== "" && result.link !== "") {
      
      //if (result.link.includes(video) =>result.link.hide())
      
        if (titlesArray.indexOf(result.title) == -1) {
          titlesArray.push(result.title);

          Article.count({ title: result.title }, function(err, test) {
            if (test === 0) {
              var entry = new Article(result);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });
            }
          });
        } 
      } 
    });
    res.redirect("/");
  });
});


router.get("/articles", function(req, res) {
  Article.find()
    .sort({ _id: -1 })
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        var artcl = { article: doc };
        res.render("index", artcl);
      }
    });
});

router.get("/articles-json", function(req, res) {
  Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});

router.get("/cleararticles", function(req, res) {
  Article.remove({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log("removed all articles");
    }
  });
  res.redirect("/articles-json");
});

//This block of code allows us to find each article

router.get("articles/:id", (req, res) => {
  
  db.Article.findOne({ _id: req.params.id })
  
  .populate("note")
  .then((dbArticle) => {
    res.json(dbArticle);
  })
  .catch((err) => {
    res.json(err);
  })
});

//This functionnality doesn't appear in the UI for now

router.post("/note/:id", function(req, res) {
  var user = req.body.name;
  var content = req.body.comment;
  var articleId = req.params.id;

  var noteObj = {
    name: user,
    body: content
  };

  var newNote = new Note (noteObj);

  newNote.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(articleId);

      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { note: doc._id } },
        { new: true }
      ).exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/readArticle/" + articleId);
        }
      });
    }
  });
});

module.exports = router;