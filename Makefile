LOG = export DEBUG=ankh:*

build: clean
	./node_modules/.bin/gulp build

test: clean
	./node_modules/.bin/gulp test
	./node_modules/.bin/testem

verbose:
	$(eval LOG = export DEBUG=ankh:*)

silent:
	LOG = unset DEBUG

clean:
	rm -rf build

node: clean
	export DEBUG=possum:* && ./node_modules/.bin/testem -l Node

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd

.PHONY: test build verbose silent docs node
