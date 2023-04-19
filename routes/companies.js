const express = require("express");
const slugify = require("slugify")
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");

router.get('/', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT * FROM companies`);
      
      return res.json({ companies: results.rows })
    } catch (e) {
      return next(e);
    }
  })

  router.get('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const results = await db.query('SELECT * FROM companies WHERE code = $1', [code])
      const invoiceResults =  await db.query('SELECT id FROM invoices WHERE comp_code = $1', [code])
      const industryResults = await db.query('SELECT industry_code FROM company_industry WHERE comp_code = $1', [code])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't find company with code of ${code}`, 404)
      }
      const company = results.rows[0];
      const invoices = invoiceResults.rows;
      const industry = industryResults.rows;

      company.invoices = invoices.map(inv => inv.id)
      company.industry = industry.map(ind => ind.industry_code)
      console.log(company.industry)

      return res.json({ "company": company })
    } catch (e) {
      return next(e)
    }
  })

  router.post('/', async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const code = slugify(name, {lower: true});
      const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [code, name, description]);
      
      return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

  router.patch('/:code', async (req, res, next) => {
    try {
      const { code } = req.params;
      const { name, description } = req.body;
      const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING  code, name, description', [name, description, code])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't update user with code of ${code}`, 404)
      }
      return res.send({ company: results.rows[0] })
    } catch (e) {
      return next(e)
    }
  })

  router.delete('/:code', async (req, res, next) => {
    try {
      const results = db.query('DELETE FROM companies WHERE code = $1', [req.params.code])
      return res.send({ msg: "DELETED!" })
    } catch (e) {
      return next(e)
    }
  })

  router.post('/:code/industries', async (req, res, next) => {
    try {
      const { code } = req.params;
      const { industry_code } = req.body;
      const companyResults = await db.query('SELECT * FROM companies WHERE code = $1', [code]);
      const industryResults = await db.query('SELECT * FROM industries WHERE code = $1', [industry_code]);
      console.log(companyResults)
      console.log(industryResults)
      
      if (companyResults.rows.length === 0) {
        throw new ExpressError(`Can't find company with code of ${code}`, 404)
      }
      if (industryResults.rows.length === 0) {
        throw new ExpressError(`Can't find industry with code of ${industry_code}`, 404)
      }
      await db.query('INSERT INTO company_industry (comp_code, industry_code) VALUES ($1, $2)', [code, industry_code]);
      return res.json({ message: `Industry ${industry_code} added to company ${code}` })
    } catch (e) {
      return next(e)
    }
  })
  



  module.exports = router;