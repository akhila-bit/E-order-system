var express = require("express");
var ejs = require("ejs");
var bodyParser = require("body-parser");
var mysql = require("mysql");
var session = require("express-session");
const bcrypt = require("bcrypt");

const users = require("./public/js/data").userDB;

mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "project_laravel",
});

var app = express();
app.use(express.static("public"));

app.set("view engine", "ejs");

app.listen(8080);

// app.get('/',function(req,res){
// res.send("wewe")})
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ resave: true, saveUninitialized: true, secret: "secret" }));

function isProductInCart(cart, id) {
  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      return true;
    }
  }

  return false;
}

function calculateTotal(cart, req) {
  total = 0;
  for (let i = 0; i < cart.length; i++) {
    //if we're offering a discounted price
    if (cart[i].sale_price) {
      total = total + cart[i].sale_price * cart[i].quantity;
    } else {
      total = total + cart[i].price * cart[i].quantity;
    }
  }
  req.session.total = total;
  return total;
}

// localhost:8080
app.get("/", function (req, res) {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });
  // req.session.reserve = false;
  con.query("SELECT * FROM products", (err, result) => {
    req.session.inventory = result;

    res.render("pages/index", {
      result: result,
      reserved: "false",
      id: req.session.table,
      // msg:'null'
    });
  });
});

app.get("/dashboard", function (req, res) {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });
  // req.session.reserve = false;
  con.query("SELECT * FROM products", (err, result) => {
    req.session.inventory = result;

    res.render("pages/dashboard", {
      result: result,
      reserved: "false",
      id: req.session.table,
      // msg:'null'
    });
  });
});

app.post("/add_to_cart", function (req, res) {
  var id = req.body.id;
  var name = req.body.name;
  var price = req.body.price;
  var sale_price = req.body.sale_price;
  var quantity = req.body.quantity;
  var image = req.body.image;
  var product = {
    id: id,
    name: name,
    price: price,
    sale_price: sale_price,
    quantity: quantity,
    image: image,
  };

  //if product already in session cart array object
  if (req.session.cart) {
    var cart = req.session.cart;

    if (!isProductInCart(cart, id)) {
      cart.push(product);
    }
  } else {
    //product first product
    req.session.cart = [product];
    var cart = req.session.cart;
  }

  //calculate total
  calculateTotal(cart, req);

  //return to cart page
  res.redirect("/cart");
});

app.get("/cart", function (req, res) {
  var cart = req.session.cart;
  var total = req.session.total;

  res.render("pages/cart", { cart: cart, total: total });
});

app.post("/remove_product", function (req, res) {
  var id = req.body.id;
  var cart = req.session.cart;

  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      cart.splice(cart.indexOf(i), 1);
    }
  }

  //re-calculate
  calculateTotal(cart, req);
  res.redirect("/cart");
});

app.post("/edit_product_quantity", function (req, res) {
  //get values from inputs
  var id = req.body.id;
  var quantity = req.body.quantity;
  var increase_btn = req.body.increase_product_quantity;
  var decrease_btn = req.body.decrease_product_quantity;

  var cart = req.session.cart;

  if (increase_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 0) {
          cart[i].quantity = parseInt(cart[i].quantity) + 1;
        }
      }
    }
  }

  if (decrease_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 1) {
          cart[i].quantity = parseInt(cart[i].quantity) - 1;
        }
      }
    }
  }

  calculateTotal(cart, req);
  res.redirect("/cart");
});

app.get("/checkout", function (req, res) {
  var total = req.session.total;
  res.render("pages/checkout", { total: total });
});

app.post("/place_order", function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;
  var city = req.body.city;
  var address = req.body.address;
  var cost = req.session.total;
  var status = "not paid";
  var date = new Date();
  var products_ids = "";
  var id = Date.now();
  req.session.order_id = id;

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  var cart = req.session.cart;
  for (let i = 0; i < cart.length; i++) {
    products_ids = products_ids + "," + cart[i].id;
  }

  con.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      var query =
        "INSERT INTO orders (id,cost,name,email,status,city,address,phone,date,products_ids) VALUES ?";
      var values = [
        [
          id,
          cost,
          name,
          email,
          status,
          city,
          address,
          phone,
          date,
          products_ids,
        ],
      ];

      con.query(query, [values], (err, result) => {
        for (let i = 0; i < cart.length; i++) {
          var query =
            "INSERT INTO order_items (order_id,product_id,product_name,product_price,product_image,product_quantity,order_date) VALUES ?";
          var values = [
            [
              id,
              cart[i].id,
              cart[i].name,
              cart[i].price,
              cart[i].image,
              cart[i].quantity,
              new Date(),
            ],
          ];
          con.query(query, [values], (err, result) => {});
        }

        res.redirect("/payment");
      });
    }
  });
});

app.get("/payment", function (req, res) {
  var total = req.session.total;
  res.render("pages/payment", { total: total });
});

app.get("/verify_payment", function (req, res) {
  var transaction_id = req.query.transaction_id;
  var order_id = req.session.order_id;

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      var query =
        "INSERT INTO payments (order_id,transaction_id,date) VALUES ?";
      var values = [[order_id, transaction_id, new Date()]];
      con.query(query, [values], (err, result) => {
        con.query(
          "UPDATE orders SET status='paid' WHERE id='" + order_id + "'",
          (err, result) => {}
        );
        res.redirect("/thank_you");
      });
    }
  });
});

app.get("/thank_you", function (req, res) {
  var order_id = req.session.order_id;
  res.render("pages/thank_you", { order_id: order_id });
});

app.get("/single_product", function (req, res) {
  var id = req.query.id;

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.query("SELECT * FROM products WHERE id='" + id + "'", (err, result) => {
    res.render("pages/single_product", { result: result });
  });
});

app.get("/products", function (req, res) {
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "node_project",
  });

  con.query("SELECT * FROM products", (err, result) => {
    res.render("pages/products", { result: result });
  });
});

app.get("/about", function (req, res) {
  res.render("pages/about");
});

app.post("/register", async (req, res) => {
  try {
    console.log("User list", users);

    let foundUser = users.find((data) => req.body.userlogin === data.email);
    if (!foundUser) {
      let hashPassword = await bcrypt.hash(req.body.passwordlogin, 10);
      if (req.body.passwordlogin == req.body.passwordconfirm) {
        let newUser = {
          id: Date.now(),
          email: req.body.userlogin,
          password: hashPassword,
          passwordlogin: req.body.passwordlogin,
        };
        users.push(newUser);

        console.log("User list", users);
        //    res.send('<div>email used</div>');
        res.redirect("../dashboard");
      } else {
        res.render("pages/index", {
          e: "Password mismatch, try again",
          email: req.body.userlogin,
        });
      }
    } else {
      res.render("pages/index", {
        e: "Email already used",
        email: req.body.userlogin,
      });
      //        res.send(`
      // <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
      // <script>
      //     $("#showload").html("<div>email used </div>")
      // </script>
      // `)
      //res.json({msg:"email in use"})
      // res.redirect('/')
      // res.render('pages/index',  {msg:"email"}     )

      //   res.render('pages/index',
      // function(err,html){
      //    res.send(html)
      //       console.log(err);
      //   }
      //   else{
      //      // console.log(html);

      // })
    }
  } catch {
    res.send("Internal server error");
  }

  // app.post('/register/success',function(req, res){
  //             res.send("<div>email used</div>")
});
app.post("/login", async (req, res) => {
  try {
    console.log(users);
    let submittedPass = req.body.passwordlogin;
    //console.log(submittedPass+"saas"+req.body.passwordlogin)
    let foundUser = users.find((data) => req.body.userlogin === data.email);
    if (foundUser) {
      // console.log(foundUser+"weef");
      let storedPass = foundUser.password;

      const passwordMatch = await bcrypt.compare(submittedPass, storedPass);
      if (passwordMatch) {
        let usrname = foundUser.username;
        res.redirect("../dashboard");

        // res.send(`<div align ='center'><h2>login successful</h2></div><br><br><br><div align ='center'><h3>Hello ${usrname}</h3></div><br><br><div align='center'><a href='partials/modal'>logout</a></div>`);
      } else {
        res.render("pages/index", { e: " Invalid email or password" });

        //res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align ='center'><a href='./login.html'>login again</a></div>");
      }
    } else {
      // let fakePass = `$2b$$10$ifgfgfgfgfgfgfggfgfgfggggfgfgfga`;
      // await bcrypt.compare(req.body.passwordlogin, fakePass);
      res.render("pages/index", { e: "Signup to create a new account" });

      // res.send("<div align ='center'><h2>Invalid email or password</h2></div><br><br><div align='center'><a href='./login.html'>login again<a><div>");
    }
  } catch {
    res.send("Internal server error");
  }
});

app.get("/partials/modal", function (req, res) {
  res.render("partials/modal");
});
