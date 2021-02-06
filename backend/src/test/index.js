/* eslint-env mocha */
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.use(chaiHttp);


it('status response succeeds', function (done) {
	chai.request('http://localhost:3000')
		.get('/topics')
		.query({ item: 'NASA' })
		.end(function (err, res) {
			expect(res).to.have.status(200);
			done();
		});
});


it('response his a data object succeeds', function (done) {
	chai.request('http://localhost:3000')
		.get('/topics')
		.query({ item: 'NASA' })
		.end(function (err, res) {
			expect(res.body.processed).should.be.a('object');
			res.body.should.have.property('processed');
			done();
		});
});


it('bad URL recognized as not found', function (done) {
	chai.request('http://localhost:3000')
		.get('/zzzzzzz')
		.query({ item: 'NASA' })
		.end(function (err, res) {
			expect(res).to.have.status(404);
			done();
		});
});

it('missing topic error discovered', function (done) {
	chai.request('http://localhost:3000')
		.get('/topics').end(function (err, res) {
			expect(res).to.have.status(400);
			done();
		});
});
