#! /usr/bin/env python2

##############################################################################
#
# Program  : character_network.py
# Author   :  Arthur and Patrice Koehl
# Version  : 1 (11/17/2018)
#
# Purpose  : Defines list of characters that appear in each chapter in a book 
#            from a text file
#
##############################################################################

##############################################################################
# Import necessary modules: re, unicode, json, networkx, community, itertools
##############################################################################

import re
import unidecode
import json
import networkx as nx
import community
import itertools

##############################################################################
# Function for reading a book in simple txt format
##############################################################################

def readText(file):
	f = open(file, "rb")
	lines = []
	for line in f:
		info = line.decode('utf-8')
		info = unidecode.unidecode(info)
		lines.append(info)
	f.close()
	return lines

##############################################################################
# Function for reading a list of Characters
##############################################################################

def readCharacters(file):
	f = open(file, "rb")
	Characters = [ ]
	for line in f:
		name=line.rstrip()
		Characters.append(name)
	return Characters

##############################################################################
# Function to parse text in chapters
##############################################################################

def getChapters(text):

	chapters = [ ]
	roman = '^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$'
	key = False
	
	for sent in text:
		if sent:
			words = sent.split()
			if len(words)==1 and re.search(roman, words[0]) is not None:
				if key:
					chapters.append(content)
				content = []
				key = True
    			else:
        			if key:
					content.append(sent)
	chapters.append(content)

	return chapters

##############################################################################
# Get characters that are present in each chapter
##############################################################################

def charChapters(chapters,characters):


	char_in_chapters = [ ]

	for chapter in chapters:
		charlist = [ ]
		for sentence in chapter:
			for name in characters:
				if re.search(r"\b(?=\w)%s\b(?!\w)" % re.escape(name),
                         	sentence, re.IGNORECASE):
					charlist.append(name)
		charlist = sorted(set(charlist))
		char_in_chapters.append(charlist)

	return char_in_chapters

##############################################################################
# Write list of characters for each chapters
##############################################################################

def writeCharacters(fname, char_in_chapters):

	f = open(fname, "wb")
	nchapter = 1
	for chapter in char_in_chapters:
		f.write("%d," % nchapter)
		for name in chapter:
			f.write("%s," % name)
		f.write("\n")
		nchapter = nchapter + 1

##############################################################################
# Main program
##############################################################################


if __name__ == "__main__":

	textfile  = raw_input("Input text file for the book (txt format)    : ")
	charfile  = raw_input("Input text file for characters (txt format)  : ")
	csvfile   = raw_input("Output csv file for characters / chapters    : ")
	jsonfile  = raw_input("Output json file for characters / chapters   : ")

##############################################################################
#	Read in books
##############################################################################

	text = readText(textfile)

##############################################################################
#	Break book into chapters
##############################################################################

	chapters=getChapters(text)

##############################################################################
#	Read in Characters and make dictionary
##############################################################################

	Characters = readCharacters(charfile)
	n_char = len(Characters)
	idx = range(0,n_char);
	corresp=dict(zip(Characters,idx))

##############################################################################
#	Get Characters in each chapter
##############################################################################

	char_in_chapters=charChapters(chapters,Characters)

	writeCharacters(csvfile, char_in_chapters)

##############################################################################
#	Define co-occurence matrix: pairs of characters appearing in
#	the same chapter
##############################################################################

	co_occurence = [[0 for x in range(n_char)] for y in range(n_char)]
	for chapter in char_in_chapters:
		pairs= itertools.combinations(chapter,2);
		for pair in pairs:
			idx1 = corresp[pair[0]]
			idx2 = corresp[pair[1]]
			co_occurence[idx1][idx2]=co_occurence[idx1][idx2]+1

##############################################################################
#	Build links
##############################################################################

G = nx.Graph()

links = []
for i in range(0, n_char-1):
	for j in range(i+1, n_char):
		if co_occurence[i][j] > 0:
			link = {}
			link["source"] = i
			link["target"] = j
			link["value"]   = co_occurence[i][j]
			links.append(link.copy())
			G.add_edge(Characters[i],Characters[j],weight=co_occurence[i][j]);

partition = community.best_partition(G)

nodes = []
for name in Characters:
	idx=corresp[name]
	group = partition[name]
	node = {}
	node["id"] = name
	node["idx"] = idx
	node["group"] = group
	nodes.append(node.copy())


outfile = open(jsonfile,"w")
outfile.write("{\"nodes\":")
outfile.write(json.dumps(nodes))
outfile.write(",")
outfile.write("\"links\":")
outfile.write(json.dumps(links))
outfile.write("}")
outfile.close()

# nx.write_gexf(G,gexffile);

