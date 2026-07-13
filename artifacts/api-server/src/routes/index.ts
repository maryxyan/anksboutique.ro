import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import categoriesRouter from "./categories";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import wishlistRouter from "./wishlist";
import reviewsRouter from "./reviews";
import newsletterRouter from "./newsletter";
import adminRouter from "./admin";
import uploadRouter from "./upload";
import sitemapRouter from "./sitemap";
import accountRouter from "./account";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(categoriesRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(wishlistRouter);
router.use(reviewsRouter);
router.use(newsletterRouter);
router.use(adminRouter);
router.use(uploadRouter);
router.use(sitemapRouter);
router.use(accountRouter);

export default router;
