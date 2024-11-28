// downvote endpoint for blogs
import { verifyAuth } from '@/utils/auth';
import { prisma } from "@/utils/db";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = await verifyAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized action" });

    const { id, diff } = req.body;
    if (!id || typeof diff !== 'number') {
        return res.status(400).json({ error: "Invalid parameters" });
    }

    // GENERATED WITH CHATGPT
    try {
        // Check if a vote already exists for this user and blog
        const existingVote = await prisma.blogVote.findUnique({
            where: {
                userId_blogId: { userId: Number(userId), blogId: Number(id) },
            }
        });

        // If user is trying to downvote
        if (diff === 1) {
            if (existingVote) {
                if (existingVote.type === "DOWNVOTE") {
                    const updatedBlog = await prisma.blog.findUnique({
                        where: { id: Number(id) }
                    });
                    return res.status(200).json(updatedBlog);
                } else if (existingVote.type === "UPVOTE") {
                    // Decrement upvotes by 1
                    await prisma.blog.update({
                        where: { id: Number(id) },
                        data: {
                            upvotes: { decrement: 1 },
                        }
                    });
                    await prisma.blogVote.update({
                        where: { id: existingVote.id },
                        data: { type: "DOWNVOTE" }
                    });
                }
                // Increment downvotes by 1
                await prisma.blog.update({
                    where: { id: Number(id) },
                    data: {
                        downvotes: { increment: 1 },
                    }
                });
                await prisma.blogVote.update({
                    where: { id: existingVote.id },
                    data: { type: "DOWNVOTE" }
                });
            } else {
                // Add a new DOWNVOTE
                await prisma.blog.update({
                    where: { id: Number(id) },
                    data: { downvotes: { increment: 1 } }
                });
                await prisma.blogVote.create({
                    data: {
                        userId: Number(userId),
                        blogId: Number(id),
                        type: "DOWNVOTE"
                    }
                });
            }
        } else if (diff === -1) {
            if (existingVote) {
                if (existingVote.type === "DOWNVOTE") {
                    await prisma.blog.update({
                        where: { id: Number(id) },
                        data: {
                            downvotes: { decrement: 1 },
                        }
                    });
                }
                await prisma.blogVote.update({
                    where: { id: existingVote.id },
                    data: { type: "" }
                });
            } else {
                return res.status(400).json({ error: "Cannot undownvote a post you haven't downvoted" })
            }
        } else {
            return res.status(400).json({ error: "Invalid diff value" });
        }

        const updatedBlog = await prisma.blog.findUnique({
            where: { id: Number(id) }
        });

        return res.status(200).json(updatedBlog);

    } catch (err) {
        console.error("Error updating blog vote:", err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}