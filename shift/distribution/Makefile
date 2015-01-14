all: trigrams.json

allwords2.zip:
	wget http://www.puzzlers.org/pub/wordlists/allwords2.zip	

NPLCombinedWordList.txt: allwords2.zip
	unzip allwords2.zip

trigrams.json: NPLCombinedWordList.txt
	python generate.py

