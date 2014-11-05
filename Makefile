LOG = export DEBUG=possum:*

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

node: clean
	$(LOG) && ./node_modules/.bin/testem -l Node

docs:
	pip install Pygments
	./node_modules/.bin/groc ./lib/**/*.js README.md
	pushd ./doc; python -m SimpleHTTPServer; popd

.PHONY: test build verbose silent docs node
