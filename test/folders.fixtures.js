function makeFoldersArray() {
    return [
        {
            id: 1,
            date_published: '2029-01-22T16:28:32.615Z',
            title: 'First test post!', 
        },
        {
            id: 2,
            date_published: '2100-05-22T16:28:32.615Z',
            title: 'Second test post!',
        },
        {
            id: 3,
            date_published: '1919-12-22T16:28:32.615Z',
            title: 'Third test post!',
        },
        {
            id: 4,
            date_published: '1919-12-22T16:28:32.615Z',
            title: 'Fourth test post!',
        },
    ];
}

function makeMaliciousFolder() {

    return {
        maliciousFolder: {
            id: 1,
            date_published: '2029-01-22T16:28:32.615Z',
            title: 'First test post!',
           
        },
        expectedFolder: {
            id: 1,
            date_published: '2029-01-22T16:28:32.615Z',
            title: 'First test post!',
        }
    }
}

module.exports = {
    makeFoldersArray,
    makeMaliciousFolder,
}