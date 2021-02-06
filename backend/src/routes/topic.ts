import * as Express from 'express';
import axios from 'axios';

export const topicGet = async (req: Express.Request, res: Express.Response) => {
    try {
        // URLs for exercise
        const WIKI_SEARCH_1 = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=';
        const WIKI_SEARCH_2 = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exintro=&titles='

        // Search term supplied by user
        const searchItem: string = req.query.item; // req.body.item;
        const query1 = WIKI_SEARCH_1 + searchItem;

        if (!searchItem || searchItem.trim() === '') {
            res.status(400).send({ message: 'No search item' });
        }
        // Using Axios for HTTP APIs 
        // Query list of topics fromwikipedia
        const resp1 = await axios.get(query1);
        const queryResp1Arr: any[] = resp1.data;

        // Assuming there's a rsponse
        if (queryResp1Arr.length >= 2) { //todo
            // Take the first topic. Its found in 1st position of the 2nd element
            const firstTopic = queryResp1Arr[1][0];
            console.log('Topic to search: ' + firstTopic);
            const query2 = WIKI_SEARCH_2 + firstTopic;
            // Make 2nd call to get topic tokens:
            const resp2 = await axios.get(query2);
            let rawContent: any = resp2.data.query.pages;

            // Extract resulting page content response:
            const pageContent = rawContent[Object.keys(rawContent)[0]];
            let extractContent = pageContent.extract;

            // Sanitize results:
            // (1) Get rid of extraneous chars like , . ; etc. List not exhaustive, but its a start
            extractContent = replaceMiscChars(extractContent);

            // Get rid of generic english words like the, in, a, of . Again, list not exhaustive, but its a start
            extractContent = replaceIrrelevantWords(extractContent);

            // Split out individaul words:
            const extractedWords = extractContent.split(/\s+/);
            console.log(extractedWords);

            // Generate array of extrated words with their associated counts. Returned array is sorted bu count
            let frequencyArr = buildWordFrequencyArray(extractedWords);

            console.log('\n\n\n\Sorted array:');
            printArray(frequencyArr);

            // Determine rank boundaries and tag each word object with its rank (1 to 5)
            buildWordRanks(frequencyArr);

            // Do alphabetic sub-sorts within each rank of works:
            const frequencyArrSorted = doSecondarySortInRanks(frequencyArr);

            // All done. Respond to user
            res.send({ processed: frequencyArrSorted });
        } else {
            throw new Error('Malformed wikipedia response');
        }
    } catch (error) {
        const msg = 'Error in topic handling. Details: ' + error.message;
        console.log(msg);
        res.status(400).send({ message: msg });
    }
};

const buildWordFrequencyArray = (extractedWords: string[]): any[] => {
    const frequencyMap = new Map<string, number>();
    for (const extractedWord of extractedWords) {
        let frequency = frequencyMap.get(extractedWord);
        if (typeof frequency === "undefined") {
            frequency = 1;
        } else {
            frequency = frequency + 1;
        }
        frequencyMap.set(extractedWord, frequency);
    }

    let frequencyArr: any[] = [];
    frequencyMap.forEach((val, key) => {
        frequencyArr.push({ word: key, count: val });
    });
    frequencyArr.sort((word1, word2) => (word1.count > word2.count) ? -1 : 1);
    return frequencyArr;
}

const doSecondarySortInRanks = (frequencyArr: any[]): any[] => {
    const rank5Arr: any[] = [];
    const rank4Arr: any[] = [];
    const rank3Arr: any[] = [];
    const rank2Arr: any[] = [];
    const rank1Arr: any[] = [];

    for (let freq of frequencyArr) {
        switch (freq.rank) {
            case 5:
                rank5Arr.push(freq);
                break;
            case 4:
                rank4Arr.push(freq);
                break;
            case 3:
                rank3Arr.push(freq);
                break;
            case 2:
                rank2Arr.push(freq);
                break;
            case 1:
                rank1Arr.push(freq);
                break;
        }
    }
    rank5Arr.sort((word1, word2) => (word1.word.toLowerCase() > word2.word.toLowerCase()) ? 1 : -1);
    rank4Arr.sort((word1, word2) => (word1.word.toLowerCase() > word2.word.toLowerCase()) ? 1 : -1);
    rank3Arr.sort((word1, word2) => (word1.word.toLowerCase() > word2.word.toLowerCase()) ? 1 : -1);
    rank2Arr.sort((word1, word2) => (word1.word.toLowerCase() > word2.word.toLowerCase()) ? 1 : -1);
    rank1Arr.sort((word1, word2) => (word1.word.toLowerCase() > word2.word.toLowerCase()) ? 1 : -1);

    const frequencyArrSorted = [];
    frequencyArrSorted.push(...rank5Arr);
    frequencyArrSorted.push(...rank4Arr);
    frequencyArrSorted.push(...rank3Arr);
    frequencyArrSorted.push(...rank2Arr);
    frequencyArrSorted.push(...rank1Arr);
    return frequencyArrSorted;
}

const printArray = (frequencyArr: any[]) => {
    for (let frequencyItem of frequencyArr) {
        console.log(frequencyItem);
    }
}

const buildWordRanks = (frequencyArr: any[]) => {
    let minBoundary;
    let maxBoundary;
    let delta;

    for (let frequencyItem of frequencyArr) {
        if (typeof minBoundary === "undefined") {
            minBoundary = frequencyItem.count;
        }
        if (typeof maxBoundary === "undefined") {
            maxBoundary = frequencyItem.count;
        }
        if (frequencyItem.count < minBoundary) {
            minBoundary = frequencyItem.count;
        }
        if (frequencyItem.count > maxBoundary) {
            maxBoundary = frequencyItem.count;
        }
    }
    console.log('minBoundary=' + minBoundary);
    console.log('maxBoundary=' + maxBoundary);
    delta = (maxBoundary - minBoundary) / 5;
    console.log('delta=' + delta);

    let rank1 = 0;
    let rank2 = 0;
    let rank3 = 0;
    let rank4 = 0;
    let rank5 = 0;

    rank1 = minBoundary + delta;
    rank2 = rank1 + delta;
    rank3 = rank2 + delta;
    rank4 = rank3 + delta;
    rank5 = rank4 + delta;
    console.log('rank1=' + rank1);
    console.log('rank2=' + rank2);
    console.log('rank3=' + rank3);
    console.log('rank4=' + rank4);
    console.log('rank5=' + rank5);
    for (let frequencyItem of frequencyArr) {
        if (frequencyItem.count <= rank5 && frequencyItem.count > rank4) {
            frequencyItem.rank = 5;
            continue;
        }
        if (frequencyItem.count <= rank4 && frequencyItem.count > rank3) {
            frequencyItem.rank = 4;
            continue;
        }
        if (frequencyItem.count <= rank3 && frequencyItem.count > rank2) {
            frequencyItem.rank = 3;
            continue;
        }
        if (frequencyItem.count <= rank2 && frequencyItem.count > rank1) {
            frequencyItem.rank = 2;
            continue;
        }
        frequencyItem.rank = 1;
    }
    printArray(frequencyArr);

}

const replaceMiscChars = (extractContent: string): string => {
    extractContent = extractContent.replace(/<[^>]*>?/gm, '');
    extractContent = extractContent.replace(/\r?\n|\r/g, '');
    console.log('\n\nExtract w/o markup and newlines:' + JSON.stringify(extractContent));
    extractContent = extractContent.replace(/,/g, ' ');
    extractContent = extractContent.replace(/\./g, ' ');
    extractContent = extractContent.replace(/;/g, ' ');
    extractContent = extractContent.replace(/'/g, ' ');
    console.log('\n\nExtract wo comma period:' + JSON.stringify(extractContent));
    extractContent = extractContent.replace(/'/g, ' ');

    return extractContent;
}

const replaceIrrelevantWords = (extractContent: string): string => {
    extractContent = extractContent.replace(/\bthe\b/ig, '');
    extractContent = extractContent.replace(/\bis\b/ig, '');
    extractContent = extractContent.replace(/\bof\b/ig, '');
    extractContent = extractContent.replace(/\bfor\b/ig, '');
    extractContent = extractContent.replace(/\bas\b/ig, '');
    extractContent = extractContent.replace(/\bwas\b/ig, '');
    extractContent = extractContent.replace(/\bin\b/ig, '');
    extractContent = extractContent.replace(/\bhave\b/ig, '');
    extractContent = extractContent.replace(/\band\b/ig, '');
    extractContent = extractContent.replace(/\bor\b/ig, '');
    extractContent = extractContent.replace(/\ban\b/ig, '');
    extractContent = extractContent.replace(/\bwhich\b/ig, '');
    extractContent = extractContent.replace(/\bto\b/ig, '');
    extractContent = extractContent.replace(/\bon\b/ig, '');
    extractContent = extractContent.replace(/\bits\b/ig, '');
    extractContent = extractContent.replace(/\bby\b/ig, '');
    extractContent = extractContent.replace(/\bthrough\b/ig, '');
    extractContent = extractContent.replace(/\bhas\b/ig, '');
    extractContent = extractContent.replace(/\bwith\b/ig, '');
    extractContent = extractContent.replace(/\bit\b/ig, '');
    extractContent = extractContent.replace(/\bhad\b/ig, '');
    extractContent = extractContent.replace(/\bthis\b/ig, '');
    extractContent = extractContent.replace(/\bare\b/ig, '');
    extractContent = extractContent.replace(/\bbe\b/ig, '');
    extractContent = extractContent.replace(/\balso\b/ig, '');
    extractContent = extractContent.replace(/\bother\b/ig, '');

    extractContent = extractContent.replace(/\ba\b/ig, '');
    extractContent = extractContent.replace(/\bb\b/ig, '');
    extractContent = extractContent.replace(/\bc\b/ig, '');
    extractContent = extractContent.replace(/\bd\b/ig, '');
    extractContent = extractContent.replace(/\be\b/ig, '');
    extractContent = extractContent.replace(/\bf\b/ig, '');
    extractContent = extractContent.replace(/\bg\b/ig, '');
    extractContent = extractContent.replace(/\bh\b/ig, '');
    extractContent = extractContent.replace(/\bi\b/ig, '');
    extractContent = extractContent.replace(/\bj\b/ig, '');
    extractContent = extractContent.replace(/\bk\b/ig, '');
    extractContent = extractContent.replace(/\bl\b/ig, '');
    extractContent = extractContent.replace(/\bm\b/ig, '');
    extractContent = extractContent.replace(/\bn\b/ig, '');
    extractContent = extractContent.replace(/\bo\b/ig, '');
    extractContent = extractContent.replace(/\bp\b/ig, '');
    extractContent = extractContent.replace(/\bq\b/ig, '');
    extractContent = extractContent.replace(/\br\b/ig, '');
    extractContent = extractContent.replace(/\bs\b/ig, '');
    extractContent = extractContent.replace(/\bt\b/ig, '');
    extractContent = extractContent.replace(/\bu\b/ig, '');
    extractContent = extractContent.replace(/\bv\b/ig, '');
    extractContent = extractContent.replace(/\bw\b/ig, '');
    extractContent = extractContent.replace(/\bx\b/ig, '');
    extractContent = extractContent.replace(/\by\b/ig, '');
    extractContent = extractContent.replace(/\bz\b/ig, '');
    return extractContent;
}
