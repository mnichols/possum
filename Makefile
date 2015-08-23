LOG = export DEBUG=possum:debug*

build: clean
	./node_modules/.bin/gulp build

test: clean
	$(LOG) && ./node_modules/.bin/gulp test
	$(LOG) && ./node_modules/.bin/testem

verbose:
	$(eval LOG= export DEBUG=possum:*)

silent:
	$(eval LOG= unset DEBUG)

clean:
	rm -rf build
	rm -rf ./examples/bundle.js

node: clean
	$(LOG) && ./node_modules/.bin/testem -l Node

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd

example: build
	cp ./build/bundle.js ./examples
	pushd ./examples; python -m SimpleHTTPServer; popd

tape:
	./node_modules/.bin/babel-tape-runner ./test/**/*-test.js #| ./node_modules/.bin/faucet

browser:
	./node_modules/.bin/browserify \
		--transform [babelify --blacklist regenerator ] \
		--debug ./test/*.js \
		| ./node_modules/.bin/browser-run -p 2222  \
		| ./node_modules/.bin/faucet



.PHONY: test build verbose silent docs node tape
