BUILD_DIR = build

build: clean
	./node_modules/.bin/browserify \
		--outfile ./${BUILD_DIR}/possum.js \
		--standalone possum \
		--debug ./lib/index.js
	
	./node_modules/.bin/browserify \
		--outfile ./${BUILD_DIR}/possum.min.js \
		--standalone possum \
		-- transform uglifyify \
		./lib/index.js

verbose:
	$(eval LOG= export DEBUG=possum:*)

silent:
	$(eval LOG= unset DEBUG)

clean:
	rm -rf $(BUILD_DIR)
	rm -rf ./examples/bundle.js
	mkdir $(BUILD_DIR)

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd

example: build
	cp ./build/bundle.js ./examples
	pushd ./examples; python -m SimpleHTTPServer; popd

test:
	./node_modules/.bin/babel-tape-runner ./test/**/*-test.js #| ./node_modules/.bin/faucet

browser:
	./node_modules/.bin/browserify \
		--debug ./test/*.js \
		| ./node_modules/.bin/browser-run -p 2222  \
		| ./node_modules/.bin/faucet



.PHONY: test build verbose silent docs node tape
