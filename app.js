//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//==== MongoDB section for storing info ====
mongoose.connect("mongodb+srv://admin-kevin:kevin961@cluster0.ojjgi.mongodb.net/todolistDB", {useNewUrlParser: true});
//itemsSchema
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema); //model
const item1 = new Item({
  name: "Welcome to your new To-Do list hosted by Heroku and MongoDB Atlas."
})
const item2 = new Item({
  name: "Press the checkbox on the left to delete an item. Press the '+' button below to add an item."
})
const item3 = new Item({
  name: "Make a new To-Do list independent of this one by specifying an original path. E.g., adding /work to the end of this URL will create(if /work does not exist) or view(if a /work list already exists) a To-Do list named work with its own unique set of items."
})
const item4 = new Item({
  name: "Note: This website is fully complete. If there are slight delays or refresh errors, it is due to the limited bandwidth of free hosting."
})
const defaultItems = [item1, item2, item3, item4];

//custom schema?
const listSchema = { //schema
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema); //model

//==== before ====
//home
app.get("/", function(req, res) {
  Item.find({}, function(err, results) {
    if(results.length === 0){
      Item.insertMany(defaultItems, function(err) {
        if(err){
          console.log(err);
        }else{
          console.log("All inserted successfuly!");
        }
      });
      res.redirect("/");
    }else{
      res.render("list", {listTitle: "Today", newListItems: results});
    }
  });
});

//add new item
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list; //fopr potentiallyuser generated custom todo lists
  const item = new Item({ //since mongodb requires insertion of objects not just a name
    name: itemName
  });

  if(listName === "Today"){ //default todo list
    item.save();
    res.redirect("/");
  }else{ //custom user generated todo list
    List.findOne({name:listName}, function(err, foundList){
      //if(!err){ //if no errors and list found
        foundList.items.push(item); //adds item to the custom user generated list
        foundList.save();
        res.redirect("/" + listName);
      //}
    });
  }

});

//del item
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){ //if default
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log("Error in deleting Item with ID: " + checkedItemId)
      }else{
        console.log("Successfully deleted Item with ID: " + checkedItemId)
      }
      res.redirect("/")
    });
  }else{ //else if custom
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemId}}} ,function(err, foundList){
      if(!err){ //if no errors and list found
        res.redirect("/" + listName);
      }
    });
  }
});

//user generated paramaters /<param>
app.get("/:untitled", function(req,res){
  const customListName = _.capitalize(req.params.untitled);
  List.findOne({name:customListName}, function(err, foundList){
    if(!err){ //if NO ERROR IN FIND COMMAND
      if(!foundList){ //if DNE
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }else{ // else it EXISTS
        //show list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT; //by def use heroku else use local :3000
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully");
});
