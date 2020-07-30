const knex = require('knex')
const app = require('../src/app')
const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures')
const { makeUsersArray } = require('./users.fixtures')
const { TEST_DB_URL } = require('../src/config')

describe('Folders Endpoints', function () {
    let db

    before('make knex instance', () => {

        db = knex({
            client: 'pg',
            connection: TEST_DB_URL,
        })
        app.set('db', db)

    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_users, noteful_notes RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_users, noteful_notes RESTART IDENTITY CASCADE'))

    describe(`GET /api/folders`, () => {
        context(`Given no folders`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, [])
            })
        })

        context('Given there are folders in the database', () => {
            const testUsers = makeUsersArray();
            const testFolders = makeFoldersArray();

            beforeEach('insert Folders', () => {
                return db
                    .into('noteful_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert(testfolders)
                    })
            })

            it('responds with 200 and all of the folders', () => {
                return supertest(app)
                    .get('/api/folders')
                    .expect(200, testFolders)
            })
        })

        context(`Given an XSS attack folder`, () => {
            const testUsers = makeUsersArray();
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

            beforeEach('insert malicious folder', () => {
                return db
                    .into('noteful_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert([maliciousFolder])
                    })
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/folder`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].title).to.eql(expectedFolder.title)
                        expect(res.body[0].content).to.eql(expectedFolder.content)
                    })
            })
        })
    })

    describe(`GET /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })
        })

        context('Given there are folders in the database', () => {
            const testUsers = makeUsersArray();
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert(testFolders)
                    })
            })

            it('responds with 200 and the specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                return supertest(app)
                    .get(`/api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })

        context(`Given an XSS attack folder`, () => {
            const testUsers = makeUsersArray();
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

            beforeEach('insert malicious folder', () => {
                return db
                    .into('noteful_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert([maliciousfolder])
                    })
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/folders/${maliciousFolder.id}`)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql(expectedFolder.title)
                        expect(res.body.content).to.eql(expectedFolder.content)
                    })
            })
        })
    })

    describe(`POST /api/folders`, () => {
        const testUsers = makeUsersArray();
        beforeEach('insert malicious folder', () => {
            return db
                .into('noteful_users')
                .insert(testUsers)
        })

        it(`creates an folder, responding with 201 and the new folder`, () => {
            const newFolder = {
                title: 'Test new folder',
                style: 'Listicle',
                content: 'Test new folder content...',
                author: '1'
            }
            return supertest(app)
                .post('/api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newFolder.title)
                    expect(res.body.style).to.eql(newFolder.style)
                    expect(res.body.content).to.eql(newFolder.content)
                    expect(res.body).to.have.property('id')
                    expect(res.headers.location).to.eql(`/api/Folders/${res.body.id}`)
                    const expected = new Intl.DateTimeFormat('en-US').format(new Date())
                    const actual = new Intl.DateTimeFormat('en-US').format(new Date(res.body.date_published))
                    expect(actual).to.eql(expected)
                })
                .then(res =>
                    supertest(app)
                        .get(`/api/folders/${res.body.id}`)
                        .expect(res.body)
                )
        })

        const requiredFields = ['title', 'style', 'content']

        requiredFields.forEach(field => {
            const newFolder = {
                title: 'Test new folder',
                style: 'Listicle',
                content: 'Test new folder content...'
            }

            it(`responds with 400 and an error message when the '${field}' is missing`, () => {
                delete newFolder[field]

                return supertest(app)
                    .post('/api/folder')
                    .send(newFolder)
                    .expect(400, {
                        error: { message: `Missing '${field}' in request body` }
                    })
            })
        })

        it('removes XSS attack content from response', () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder()
            return supertest(app)
                .post(`/api/folders`)
                .send(maliciousFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(expectedFolder.title)
                    expect(res.body.content).to.eql(expectedFolder.content)
                })
        })
    })

    describe(`DELETE /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })
        })

        context('Given there are folders in the database', () => {
            const testUsers = makeUsersArray();
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert(testFolders)
                    })
            })

            it('responds with 204 and removes the folder', () => {
                const idToRemove = 2
                const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/folders/${idToRemove}`)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders`)
                            .expect(expectedFolders)
                    )
            })
        })
    })

    describe(`PATCH /api/folders/:folder_id`, () => {
        context(`Given no folders`, () => {
            it(`responds with 404`, () => {
                const folderId = 123456
                return supertest(app)
                    .delete(`/api/folders/${folderId}`)
                    .expect(404, { error: { message: `Folder doesn't exist` } })
            })
        })

        context('Given there are folders in the database', () => {
            const testUsers = makeUsersArray();
            const testFolders = makeFoldersArray()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_users')
                    .insert(testUsers)
                    .then(() => {
                        return db
                            .into('noteful_folders')
                            .insert(testFolders)
                    })
            })

            it('responds with 204 and updates the folder', () => {
                const idToUpdate = 2
                const updateFolder = {
                    title: 'updated folder title',
                    style: 'Interview',
                    content: 'updated folder content',
                }
                const expectedFolder = {
                    ...testFolders[idToUpdate - 1],
                    ...updateFolder
                }
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send(updateFolder)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(expectedFolder)
                    )
            })

            it(`responds with 400 when no required fields supplied`, () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {
                            message: `Request body must contain either 'title', 'style' or 'content'`
                        }
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateFolder = {
                    title: 'updated folder title',
                }
                const expectedFolder = {
                    ...testFolders[idToUpdate - 1],
                    ...updateFolder
                }

                return supertest(app)
                    .patch(`/api/folders/${idToUpdate}`)
                    .send({
                        ...updateFolder,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get(`/api/folders/${idToUpdate}`)
                            .expect(expectedFolder)
                    )
            })
        })
    })
})