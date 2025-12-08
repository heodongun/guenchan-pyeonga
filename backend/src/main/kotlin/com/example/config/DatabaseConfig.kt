package com.example.config

import com.example.domain.article.Articles
import com.example.domain.comment.Comments
import com.example.domain.event.Events
import com.example.domain.place.Places
import com.example.domain.reservation.Reservations
import com.example.domain.user.Users
import com.example.config.DataSeeder
import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import kotlinx.coroutines.Dispatchers
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseConfig {
    fun init() {
        val config = HikariConfig().apply {
            jdbcUrl = System.getenv("DB_URL") ?: "jdbc:mysql://localhost:3306/board_db"
            driverClassName = "com.mysql.cj.jdbc.Driver"
            username = System.getenv("DB_USER") ?: "root"
            password = System.getenv("DB_PASSWORD") ?: "password"
            maximumPoolSize = 10
            isAutoCommit = false
            transactionIsolation = "TRANSACTION_REPEATABLE_READ"
            validate()
        }

        Database.connect(HikariDataSource(config))

        // 테이블 생성 및 컬럼 보강
        transaction {
            SchemaUtils.createMissingTablesAndColumns(Users, Articles, Comments, Places, Events, Reservations)
        }

        // 기본 데이터 시드
        DataSeeder.seed()
    }

    suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(Dispatchers.IO) { block() }
}
