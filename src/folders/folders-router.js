const path = require('path')
const express = require('express')
const xss = require('xss')
const FoldersService = require('./folders-service')

const foldersRouter = express.Router()
const jsonParser = express.json()

foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(
            req.app.get('db')
        )
            .then(folders => {
                res.json(folders)
            })
            .catch(next)
    })
    .post(jsonParser, (req, res, next) => {
        const { title, content, style, author } = req.body
        const newFolder = { title, content, style, author }

        if (!title) {
            return res.status(400).json({
                error: { message: `Missing 'title' in request body` }
            })
        }

        if (!content) {
            return res.status(400).json({
                error: { message: `Missing 'content' in request body` }
            })
        }

        if (!style) {
            return res.status(400).json({
                error: { message: `Missing 'style' in request body` }
            })
        }

        if (!author) {
            return res.status(400).json({
                error: { message: `Missing 'author' in request body` }
            })
        }

        newFolder.author = author
        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `/${folder.id}`))
                    .json(folder)
            })
            .catch(next)
    })

foldersRouter
    .route('/:folder_id')
    .all((req, res, next) => {
        FoldersService.getById(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(folder => {
                if (!folder) {
                    return res.status(404).json({
                        error: { message: `Folder doesn't exist` }
                    })
                }
                res.folder = folder // save the folder for the next middleware
                next() // don't forget to call next so the next middleware happens!
            })
            .catch(next)
    })
    .get((req, res, next) => {

        res.json({
            id: res.folder.id,
            style: res.folder.style,
            title: xss(res.folder.title), // sanitize title
            content: xss(res.folder.content), // sanitize content
            date_published: res.folder.date_published,
            author: res.folder.author,
        })
        next()
    })
    .delete((req, res, next) => {
        FoldersService.deletefolder(
            req.app.get('db'),
            req.params.folder_id
        )
            .then(() => {
                res.status(204).end()
            })
            .catch(next)
    })

    .patch(jsonParser, (req, res, next) => {
        const { title, content, style } = req.body
        const folderToUpdate = { title, content, style }

        const numberOfValues = Object.values(folderToUpdate).filter(Boolean).length
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title', 'style' or 'content'`
                }
            })
        }
        FoldersService.updateFolder(
            req.app.get('db'),
            req.params.folder_id,
            folderToUpdate
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = foldersRouter