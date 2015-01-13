# coding: utf-8

# In[99]:

import itertools
import random
import sys, os
import re
import random
import json

words = open("npl.txt").read().split("\n")
words = [re.sub("[^A-Za-z]+", "", x).upper() for x in words]


# In[ ]:




# In[131]:

print len(words) 

distribution = {}

def saw(seen):
    if seen in distribution:
        distribution[seen] += 1
    else:
        distribution[seen] = 1

NGRAM = 3
SAMPLES = 1000000
for n in range(SAMPLES):
    sample = random.sample(words, 2)
    sample = "".join(sample)
    if len(sample) < NGRAM: continue
    #print sample
    for i in range(len(sample)-2):
        saw(sample[i:i+NGRAM])

vals = list(distribution.iteritems())
vals.sort(key=lambda x:-1* x[1])

#for v in vals:
#    print "%s: %s"%v

output = open("/tmp/distribution.json", "w")
json.dump(distribution, output)
output.close()

    


# In[135]:

print vals[len(vals)/2]


# In[184]:

input_phrase = "pizzazzzebra"

def shift_letter(l, i):
    shifted =  ((ord(l)-65) + i)%26 + 65
    return chr(shifted)

def caesars(s):
    s = s.upper()
    results = []
    for i in range(0, 26):
        shift = [shift_letter(l, i) for l in s]
        results.append("".join(shift))
    return results

CRAPPY_THRESHOLD = distribution['EVV']

def score(s):
  #  print s
    raw = []
    for c in range(len(s)-2):
        trigram = s[c:c+NGRAM]
        if trigram in distribution:
           # print trigram, distribution[trigram]
            raw.append(distribution[trigram])
        else:
            #print trigram, 0
            raw.append(0)
            
    score = sum(raw)
    crappies = filter(lambda x: x <= CRAPPY_THRESHOLD, raw)
    crappy_count = len(crappies)
    return score - crappy_count * distribution['ING']

shifts = caesars(input_phrase)
shifts = [(score(x), x) for x in shifts]
          
shifts.sort(key=lambda x: -1*x[0])
print len(distribution)
for s in  shifts:
    print s


# In[193]:


print len(filter(lambda x: x[1] > 0, vals))
print  len(filter(lambda x: x[1] < distribution['EVV'], vals))
print distribution['EVV']

