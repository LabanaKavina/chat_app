const express = require("express");
const router = express.Router();
const client = require("./db");


router.get("/", async (req, res) => {
  let { rows } = await client.query("select * from users");
  res.json(rows);
});

router.get('/me/:id',async(req,res) => {
    let { rows } = await client.query("select * from users where id = $1",[req.params.id]);
  res.json(rows);
})


module.exports = router;
