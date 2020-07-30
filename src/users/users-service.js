const UsersService = {
    getAllUsers(knex) {
        return knex.select('*').from('noteful_users')
    },

    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into('noteful_users')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    getById(knex, id) {
        return knex
            .from('noteful_users')
            .select('*')
            .where('id', id)
            .first()
    },

    deleteUser(knex, id) {
        return knex('noteful_users')
            .where({ id })
            .delete()
    },

    updateUser(knex, id, newUserFields) {
        return knex('noteful_users')
            .where({ id })
            .update(newUserFields)
    },
}

module.exports = UsersService