package com.example.service

import com.example.config.DatabaseConfig.dbQuery
import com.example.domain.comment.Comment
import com.example.domain.comment.CommentResponse
import com.example.domain.comment.CreateCommentRequest
import com.example.domain.comment.toResponse
import com.example.repository.ArticleRepository
import com.example.repository.CommentRepository
import com.example.util.exceptions.BadRequestException
import com.example.util.exceptions.ForbiddenException
import com.example.util.exceptions.NotFoundException

class CommentService(
    private val commentRepository: CommentRepository = CommentRepository(),
    private val articleRepository: ArticleRepository = ArticleRepository()
) {

    suspend fun createComment(request: CreateCommentRequest, authorId: Long): Comment {
        if (request.content.isBlank()) {
            throw BadRequestException("댓글 내용을 입력해주세요.")
        }

        // 게시글 존재 여부 확인
        dbQuery {
            if (!articleRepository.existsById(request.articleId)) {
                throw NotFoundException("게시글을 찾을 수 없습니다.")
            }
        }

        // 부모 댓글 존재 여부 확인
        if (request.parentId != null) {
            dbQuery {
                if (!commentRepository.existsById(request.parentId)) {
                    throw NotFoundException("부모 댓글을 찾을 수 없습니다.")
                }
            }
        }

        return dbQuery {
            commentRepository.create(
                content = request.content,
                authorId = authorId,
                articleId = request.articleId,
                parentId = request.parentId
            )
        }
    }

    /**
     * 게시글의 모든 댓글을 계층 구조로 조회
     */
    suspend fun getCommentsByArticleId(articleId: Long): List<CommentResponse> {
        val comments = dbQuery { commentRepository.findByArticleId(articleId) }
        return buildCommentTree(comments)
    }

    /**
     * 재귀적 삭제 로직
     * 1. 자식 댓글이 있는 경우 -> Soft Delete (논리적 삭제)
     * 2. 자식 댓글이 없는 경우 -> Hard Delete (물리적 삭제)
     * 3. 부모 댓글이 이미 삭제된 경우 -> 부모도 재귀적으로 삭제 검사
     */
    suspend fun deleteComment(commentId: Long, userId: Long) {
        val comment = dbQuery {
            commentRepository.findById(commentId)
                ?: throw NotFoundException("댓글을 찾을 수 없습니다.")
        }

        if (comment.authorId != userId) {
            throw ForbiddenException("댓글 삭제 권한이 없습니다.")
        }

        dbQuery {
            val childrenCount = commentRepository.countNonDeletedChildren(commentId)

            if (childrenCount > 0) {
                // 자식 댓글이 있으면 Soft Delete
                commentRepository.softDelete(commentId)
            } else {
                // 자식 댓글이 없으면 Hard Delete
                commentRepository.hardDelete(commentId)

                // 부모 댓글도 재귀적으로 삭제 검사
                comment.parentId?.let { parentId ->
                    recursivelyDeleteOrphanedParents(parentId)
                }
            }
        }
    }

    /**
     * 고아가 된 부모 댓글을 재귀적으로 삭제
     * 부모가 이미 삭제 상태이고, 자식이 없으면 물리적 삭제
     */
    private suspend fun recursivelyDeleteOrphanedParents(parentId: Long) {
        val parent = commentRepository.findById(parentId) ?: return

        // 부모가 삭제되지 않은 상태면 중단
        if (!parent.isDeleted) return

        // 부모의 자식 중 삭제되지 않은 댓글이 있는지 확인
        val nonDeletedChildren = commentRepository.countNonDeletedChildren(parentId)

        if (nonDeletedChildren == 0L) {
            // 자식이 없으면 물리적 삭제
            commentRepository.hardDelete(parentId)

            // 조부모도 재귀적으로 검사
            parent.parentId?.let { grandParentId ->
                recursivelyDeleteOrphanedParents(grandParentId)
            }
        }
    }

    /**
     * 평탄화된 댓글 리스트를 계층 구조로 변환
     */
    private fun buildCommentTree(comments: List<Comment>): List<CommentResponse> {
        val commentMap = mutableMapOf<Long, MutableList<Comment>>()
        val rootComments = mutableListOf<Comment>()

        // 부모 ID별로 그룹화
        comments.forEach { comment ->
            if (comment.parentId == null) {
                rootComments.add(comment)
            } else {
                commentMap.getOrPut(comment.parentId) { mutableListOf() }.add(comment)
            }
        }

        // 재귀적으로 트리 구성
        fun buildTree(comment: Comment): CommentResponse {
            val children = commentMap[comment.id]?.map { buildTree(it) } ?: emptyList()
            return comment.copy(children = children.map { response ->
                comments.find { it.id == response.id }!!.copy(
                    children = response.children.map { childResponse ->
                        comments.find { it.id == childResponse.id }!!
                    }
                )
            }).toResponse()
        }

        return rootComments.map { buildTree(it) }
    }
}
