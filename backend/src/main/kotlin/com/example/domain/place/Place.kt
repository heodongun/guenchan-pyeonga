package com.example.domain.place

import com.example.util.LocalDateTimeSerializer
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.dao.id.LongIdTable
import org.jetbrains.exposed.sql.javatime.CurrentDateTime
import org.jetbrains.exposed.sql.javatime.datetime
import java.time.LocalDateTime

object Places : LongIdTable("places") {
    val name = varchar("name", 255)
    val tag = varchar("tag", 100)
    val meta = varchar("meta", 255)
    val location = varchar("location", 255)
    val description = text("description")
    val createdAt = datetime("created_at").defaultExpression(CurrentDateTime)
}

@Serializable
data class Place(
    val id: Long,
    val name: String,
    val tag: String,
    val meta: String,
    val location: String,
    val description: String,
    @Serializable(with = LocalDateTimeSerializer::class)
    val createdAt: LocalDateTime
)
