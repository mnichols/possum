BUILD_DIR = build

build: clean
	@echo building in $(CURDIR)
	./node_modules/.bin/browserify  --outfile ./$(BUILD_DIR)/possum.js  --debug  -r ./lib/index.js:possum

verbose:
	$(eval LOG= export DEBUG=possum:*)

silent:
	$(eval LOG= unset DEBUG)

clean:
	rm -rf ./$(BUILD_DIR)
	rm -rf ./examples/possum.js
	mkdir ./$(BUILD_DIR)

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd

example: build
	cp ./build/possum.js ./examples
	pushd ./examples; python -m SimpleHTTPServer; popd

test:
	./node_modules/.bin/babel-tape-runner ./test/**/*-test.js | ./node_modules/.bin/faucet

docs:
	./node_modules/.bin/doxx --title possum --source lib --target docs

publish: docs
	./node_modules/.bin/gh-pages -d docs

browser:
	./node_modules/.bin/browserify --debug ./test/*.js | ./node_modules/.bin/browser-run -p 2222 | ./node_modules/.bin/faucet

ci: build test
	./node_modules/.bin/zuul -- ./test/**/*-test.js

.PHONY: test build verbose silent docs ci browser docs publish
