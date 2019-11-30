//The whole homework is strongly inspired by https://github.com/Dcoxmen/scraper_news


var express = require("express");
var router = express.Router();

var request = require("request");
var cheerio = require("cheerio");

var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.redirect("/articles");
});


router.get("/getnews", function(req, res) {
  request("https://www.eurosport.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    var titlesArray = [];

    $("div").each(function(i, element) {
      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      if (result.title !== "" && result.link !== "") {
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
        } else {
          console.log("Article already exists.");
        }
      } else {
        console.log("Not saved to DB, missing data");
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
 //app.get("/articles/:id", function(req, res) {
// Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
//   db.Article.findOne({ _id: req.params.id })
//     // ..and populate all of the notes associated with it
//     .populate("note")
//     .then(function(dbArticle) {
//       // If we were able to successfully find an Article with the given id, send it back to the client
//       res.json(dbArticle);
//     })
//     .catch(function(err) {
//       // If an error occurred, send it to the client
//       res.json(err);
//     });
// });
// router.get("/readArticle/:id", function(req, res) {
//   var articleId = req.params.id;
//   var hbsObj = {
//     article: [],
//     body: []
//   };

//   Article.findOne({ _id: articleId })
//     .populate("note")
//     .exec(function(err, doc) {
//       if (err) {
//         console.log("Error: " + err);
//       } else {
//         hbsObj.article = doc;
//         var link = doc.link;
//         request(link, function(error, response, html) {
//           var $ = cheerio.load(response.data);

//           $(".storyfull__content").each(function(i, element) {
//             hbsObj.body = $(this)
//               .children(".storyfull__teaser")
//               .children("storyfull__paragraphs")
//               .text();

//             res.render("article", hbsObj);
//             return false;
//           });
//         });
//       }
//     });
// });

router.get("articles/:id", (req, res) => {
  // query that finds the matching one in our db
  db.Article.findOne({ _id: req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  .then((dbArticle) => {
    // If we were able to successfully find an Article with the given id, send it back to the client
    res.json(dbArticle);
  })
  .catch((err) => {
    res.json(err);
  })
});

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