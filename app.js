const express = require("express");
const app = express();
const _ = require("lodash");
const mongoose = require("mongoose");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static(`${__dirname}/public`));

// conectar ao banco de dados
mongoose.connect("mongodb+srv://rubeans:<password>@cluster0.eerwg.mongodb.net/toDoListDB"); //não esqueça da senha para rodar o app

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Item name not especified."]
    }
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Clique no + para adicionar"
});
const item2 = new Item({
    name: "<<< Clique aqui para deletar"
});

const defaultItems = [item1, item2];

const customListSchema = new mongoose.Schema({
    name: {
        type: String,
        require: [true, "custom list name not especified."]
    },
    lists: [itemSchema]
});

const CustomList = mongoose.model("List", customListSchema);


// lista padrão
app.get("/", (req, res) => {
    Item.find({}, (err, foundItems) => { // {} sem nenhum parametro ira achar todo documento q esta na collection
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("Default documents loaded.");
                };
            });

            res.redirect("/"); // precisa voltar para o root para realmente adcionar os items, caso não tenha nenhum. Caso tenha item ira direto para o else
        } else {
            res.render("list", {
                listTitle: "Hoje",
                newItems: foundItems
            });
        };
    });

    //desse jeito não ficara adicionando o mesmo item a cada vez que salvar o codigo. E se apagar todos os items na lista, ira readicionar os items padroes
});

// adicionar novos items
app.post("/", (req, res) => {
    const itemName = req.body.nextToDoItem;
    const listName = req.body.subBtnList;

    const newItemAddedByClient = new Item({
        name: itemName
    });

    if (listName === "Hoje") {
        newItemAddedByClient.save();
        res.redirect("/");
    }
    else {
        CustomList.findOne({ name: listName }, (err, foundList) => {
            foundList.lists.push(newItemAddedByClient);
            foundList.save();
            res.redirect(`/${listName}`);
        })
    }
});

// deletar items
app.post("/delete", (req, res) => {
    const checkedItemToBeDeleted = req.body.checkboxItem;
    const customItemToBeDeleted = req.body.listName;

    //caso seja a lista padrão
    if (customItemToBeDeleted === "Hoje") {
        Item.findByIdAndDelete(checkedItemToBeDeleted, (err) => {
            if (!err) {
                console.log("Successfully deleted an item.");
                res.redirect("/");
            };
        });
    }
    //caso seja a lista customizada
    else {
        CustomList.findOneAndUpdate({ name: customItemToBeDeleted }, { $pull: { lists: { _id: checkedItemToBeDeleted } } }, (err, foundList) => {
            if (!err) {
                res.redirect(`/${customItemToBeDeleted}`);
            }
        });
    };
});

// lista customizada
app.get("/:customListParam", (req, res) => {
    const param = _.capitalize(req.params.customListParam);

    CustomList.findOne({ name: param }, (err, foundLists) => {
        if (!err) {
            if (!foundLists) {
                const list = new CustomList({
                    name: param,
                    lists: defaultItems
                });

                list.save();
                res.redirect(`/${param}`)
            }
            else {
                res.render("list", {
                    listTitle: foundLists.name,
                    newItems: foundLists.lists
                });
            };
        };
    });
});


let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
};

app.listen(port, () => {
    console.log("Server has started successfully...");
});