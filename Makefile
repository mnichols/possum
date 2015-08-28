BUILD_DIR = build

build: clean
	./node_modules/.bin/browserify \
		--outfile ./${BUILD_DIR}/possum.js \
		--debug \
		-r ./lib/index.js:possum
	
	# TODO minified builds are busted by es6 features :(
	#./node_modules/.bin/browserify \
		--outfile ./${BUILD_DIR}/possum.min.js \
		--standalone possum \
		--transform uglifyify ./lib/index.js

verbose:
	$(eval LOG= export DEBUG=possum:*)

silent:
	$(eval LOG= unset DEBUG)

clean:
	rm -rf $(BUILD_DIR)
	rm -rf ./examples/possum.js
	mkdir $(BUILD_DIR)

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd

example: build
	cp ./build/possum.js ./examples
	pushd ./examples; python -m SimpleHTTPServer; popd

test:
	./node_modules/.bin/babel-tape-runner ./test/**/*-test.js \
		| ./node_modules/.bin/faucet

browser:
	./node_modules/.bin/browserify \
		--debug ./test/*.js \
		| ./node_modules/.bin/browser-run -p 2222  \
		| ./node_modules/.bin/faucet

ci: build test
	./node_modules/.bin/browserify \
		--debug ./test/*.js \
		--outfile ./$(BUILD_DIR)/possum.test.js
	./node_modules/.bin/zuul -- ./$(BUILD_DIR)/possum.test.js




.PHONY: test build verbose silent docs ci browser
